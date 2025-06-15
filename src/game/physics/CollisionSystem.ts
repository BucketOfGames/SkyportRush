import * as THREE from 'three';

export interface Collider {
  type: 'box' | 'sphere' | 'plane' | 'mesh';
  position: THREE.Vector3;
  size?: THREE.Vector3; // For box colliders
  radius?: number; // For sphere colliders
  mesh?: THREE.Mesh; // For mesh colliders
  normal?: THREE.Vector3; // For plane colliders
  isStatic: boolean;
  id: string;
}

export interface CollisionResult {
  hasCollision: boolean;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  collider: Collider;
}

export class CollisionSystem {
  private colliders: Map<string, Collider> = new Map();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

  public addCollider(collider: Collider): void {
    this.colliders.set(collider.id, collider);
  }

  public removeCollider(id: string): void {
    this.colliders.delete(id);
  }

  public checkCollision(position: THREE.Vector3, radius: number = 0.5): CollisionResult | null {
    for (const collider of this.colliders.values()) {
      const result = this.checkColliderCollision(position, radius, collider);
      if (result.hasCollision) {
        return result;
      }
    }
    return null;
  }

  public getHeightAtPosition(x: number, z: number): number {
    // Cast a ray downward from high above to find ground height
    const rayOrigin = new THREE.Vector3(x, 1000, z);
    const rayDirection = new THREE.Vector3(0, -1, 0);
    
    this.raycaster.set(rayOrigin, rayDirection);
    
    // Check against ground plane and terrain colliders
    for (const collider of this.colliders.values()) {
      if (collider.type === 'plane' || collider.type === 'mesh') {
        const intersection = this.raycastCollider(this.raycaster, collider);
        if (intersection) {
          return intersection.point.y;
        }
      }
    }
    
    // Fallback to procedural height calculation
    return this.calculateProceduralHeight(x, z);
  }

  private calculateProceduralHeight(x: number, z: number): number {
    // Use the same noise functions as the terrain generator
    const height1 = this.terrainNoise(x * 0.01, z * 0.01) * 8;
    const height2 = this.terrainNoise(x * 0.005, z * 0.005) * 15;
    const height3 = this.terrainNoise(x * 0.02, z * 0.02) * 3;
    const craters = this.craterNoise(x, z);
    
    return height1 + height2 + height3 + craters;
  }

  private terrainNoise(x: number, z: number): number {
    return Math.sin(x * 2) * Math.cos(z * 1.5) + 
           Math.sin(x * 4) * Math.cos(z * 3) * 0.5 +
           Math.sin(x * 8) * Math.cos(z * 6) * 0.25;
  }

  private craterNoise(x: number, z: number): number {
    const craterX = Math.floor(x / 80) * 80;
    const craterZ = Math.floor(z / 80) * 80;
    const distance = Math.sqrt((x - craterX) ** 2 + (z - craterZ) ** 2);
    
    if (distance < 20 && Math.random() > 0.8) {
      return -Math.max(0, 8 - distance * 0.4);
    }
    return 0;
  }

  private checkColliderCollision(position: THREE.Vector3, radius: number, collider: Collider): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      distance: 0,
      collider
    };

    switch (collider.type) {
      case 'plane':
        return this.checkPlaneCollision(position, radius, collider);
      case 'box':
        return this.checkBoxCollision(position, radius, collider);
      case 'sphere':
        return this.checkSphereCollision(position, radius, collider);
      case 'mesh':
        return this.checkMeshCollision(position, radius, collider);
    }

    return result;
  }

  private checkPlaneCollision(position: THREE.Vector3, radius: number, collider: Collider): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: new THREE.Vector3(),
      normal: collider.normal || new THREE.Vector3(0, 1, 0),
      distance: 0,
      collider
    };

    // For ground plane, check if player is below ground level
    const groundHeight = this.calculateProceduralHeight(position.x, position.z);
    const playerBottom = position.y - radius;

    if (playerBottom <= groundHeight) {
      result.hasCollision = true;
      result.point.set(position.x, groundHeight, position.z);
      result.distance = groundHeight - playerBottom;
    }

    return result;
  }

  private checkBoxCollision(position: THREE.Vector3, radius: number, collider: Collider): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      distance: 0,
      collider
    };

    if (!collider.size) return result;

    const halfSize = collider.size.clone().multiplyScalar(0.5);
    const distance = position.clone().sub(collider.position);

    // Check if sphere intersects with box
    const closest = new THREE.Vector3(
      Math.max(-halfSize.x, Math.min(halfSize.x, distance.x)),
      Math.max(-halfSize.y, Math.min(halfSize.y, distance.y)),
      Math.max(-halfSize.z, Math.min(halfSize.z, distance.z))
    );

    const distanceToClosest = distance.clone().sub(closest).length();

    if (distanceToClosest <= radius) {
      result.hasCollision = true;
      result.point.copy(collider.position).add(closest);
      result.normal.copy(distance).sub(closest).normalize();
      result.distance = radius - distanceToClosest;
    }

    return result;
  }

  private checkSphereCollision(position: THREE.Vector3, radius: number, collider: Collider): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      distance: 0,
      collider
    };

    if (!collider.radius) return result;

    const distance = position.distanceTo(collider.position);
    const totalRadius = radius + collider.radius;

    if (distance <= totalRadius) {
      result.hasCollision = true;
      result.normal.subVectors(position, collider.position).normalize();
      result.point.copy(collider.position).add(result.normal.clone().multiplyScalar(collider.radius));
      result.distance = totalRadius - distance;
    }

    return result;
  }

  private checkMeshCollision(position: THREE.Vector3, radius: number, collider: Collider): CollisionResult {
    const result: CollisionResult = {
      hasCollision: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      distance: 0,
      collider
    };

    // Simplified mesh collision - cast ray downward
    const rayOrigin = new THREE.Vector3(position.x, position.y + 10, position.z);
    const rayDirection = new THREE.Vector3(0, -1, 0);
    this.raycaster.set(rayOrigin, rayDirection);

    const intersection = this.raycastCollider(this.raycaster, collider);
    if (intersection && intersection.point.y >= position.y - radius) {
      result.hasCollision = true;
      result.point.copy(intersection.point);
      result.normal.copy(intersection.face?.normal || new THREE.Vector3(0, 1, 0));
      result.distance = (position.y - radius) - intersection.point.y;
    }

    return result;
  }

  private raycastCollider(raycaster: THREE.Raycaster, collider: Collider): THREE.Intersection | null {
    if (collider.mesh) {
      const intersections = raycaster.intersectObject(collider.mesh, true);
      return intersections.length > 0 ? intersections[0] : null;
    }
    return null;
  }

  public resolveCollision(position: THREE.Vector3, velocity: THREE.Vector3, collision: CollisionResult): void {
    if (!collision.hasCollision) return;

    // Move position out of collision
    position.add(collision.normal.clone().multiplyScalar(collision.distance));

    // Remove velocity component in collision direction
    const velocityInNormal = velocity.dot(collision.normal);
    if (velocityInNormal < 0) {
      velocity.sub(collision.normal.clone().multiplyScalar(velocityInNormal));
    }
  }

  public getColliders(): Map<string, Collider> {
    return this.colliders;
  }
}