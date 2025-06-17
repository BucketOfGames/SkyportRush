import * as THREE from 'three';

interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  range: number;
  distanceTraveled: number;
  id: string;
}

export class WeaponSystem {
  private scene: THREE.Scene;
  private projectiles: Projectile[] = [];
  private projectileCount: number = 0;
  private currentAmmo: number = 30;
  private maxAmmo: number = 30;
  private lastFired: number = 0;
  private fireRate: number = 200; // ms between shots

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public fire(position: THREE.Vector3, direction: THREE.Vector3): void {
    const now = Date.now();
    if (now - this.lastFired < this.fireRate || this.currentAmmo <= 0) {
      return;
    }

    this.lastFired = now;
    this.currentAmmo--;

    // Create projectile
    const geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      emissive: 0x0088ff
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.2, 8, 6);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    const velocity = direction.clone().multiplyScalar(50);
    
    const projectile: Projectile = {
      mesh,
      velocity,
      damage: 25,
      range: 100,
      distanceTraveled: 0,
      id: `projectile_${this.projectileCount++}`
    };

    mesh.userData = { id: projectile.id };
    
    this.projectiles.push(projectile);
    this.scene.add(mesh);
  }

  public update(deltaTime: number): void {
    this.projectiles.forEach(projectile => {
      // Move projectile
      const movement = projectile.velocity.clone().multiplyScalar(deltaTime);
      projectile.mesh.position.add(movement);
      projectile.distanceTraveled += movement.length();

      // Remove if out of range
      if (projectile.distanceTraveled > projectile.range) {
        this.removeProjectile(projectile.id);
      }
    });

    // Auto-reload
    if (this.currentAmmo === 0) {
      setTimeout(() => {
        this.currentAmmo = this.maxAmmo;
      }, 2000);
    }
  }

  public removeProjectile(id: string): void {
    const index = this.projectiles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.scene.remove(this.projectiles[index].mesh);
      this.projectiles.splice(index, 1);
    }
  }

  public getProjectiles(): THREE.Mesh[] {
    return this.projectiles.map(p => p.mesh);
  }

  public getCurrentAmmo(): number {
    return this.currentAmmo;
  }
}