import * as THREE from 'three';
import { InputManager3D } from '../managers/InputManager3D';

export class Player3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private playerMesh: THREE.Mesh;
  private velocity: THREE.Vector3;
  private isGrounded: boolean = true;
  private moveSpeed: number = 12;
  private jumpSpeed: number = 8;
  private mouseSensitivity: number = 0.002;
  
  // Camera control variables - modern third-person shooter style
  private cameraDistance: number = 5;
  private cameraHeight: number = 1.5;
  private shoulderOffset: number = 1.2;
  private yaw: number = 0;
  private pitch: number = 0.2;
  private maxPitch: number = Math.PI / 3;
  private minPitch: number = -Math.PI / 4;
  
  // Smooth camera following
  private cameraLerpSpeed: number = 10;
  private rotationLerpSpeed: number = 8;

  // Terrain collision
  private raycaster: THREE.Raycaster;
  private terrainHeightFunction: ((x: number, z: number) => number) | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.velocity = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    
    this.createPlayerMesh();
    this.setupCamera();
  }

  public setTerrainHeightFunction(heightFunction: (x: number, z: number) => number): void {
    this.terrainHeightFunction = heightFunction;
  }

  private createPlayerMesh(): void {
    // Create a futuristic player body
    const geometry = new THREE.CapsuleGeometry(0.5, 1.8, 4, 8);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff,
      emissive: 0x004466,
      shininess: 100
    });
    
    this.playerMesh = new THREE.Mesh(geometry, material);
    this.playerMesh.position.set(0, 2, 0);
    this.playerMesh.castShadow = true;
    this.scene.add(this.playerMesh);

    // Add glowing chest detail
    const detailGeometry = new THREE.RingGeometry(0.3, 0.4, 8);
    const detailMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9
    });
    
    const detail = new THREE.Mesh(detailGeometry, detailMaterial);
    detail.position.set(0, 0.5, 0.51);
    this.playerMesh.add(detail);

    // Add weapon attachment
    const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    const weaponMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.3, 0.2, 0.5);
    this.playerMesh.add(weapon);
  }

  private setupCamera(): void {
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const deltaTime = 0.016;
    
    // Get player position
    const playerPos = this.playerMesh.position.clone();
    
    // Calculate camera position based on yaw and pitch (third-person)
    const horizontalDistance = this.cameraDistance * Math.cos(this.pitch);
    const verticalOffset = this.cameraDistance * Math.sin(this.pitch);
    
    // Position camera behind player based on yaw
    const idealCameraPos = new THREE.Vector3();
    idealCameraPos.x = playerPos.x + Math.sin(this.yaw) * horizontalDistance;
    idealCameraPos.z = playerPos.z + Math.cos(this.yaw) * horizontalDistance;
    idealCameraPos.y = playerPos.y + this.cameraHeight + verticalOffset;
    
    // Add shoulder offset (move camera to the right for over-shoulder view)
    const rightVector = new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
    idealCameraPos.add(rightVector.multiplyScalar(this.shoulderOffset));
    
    // Prevent camera from going below terrain
    const terrainHeightAtCamera = this.getTerrainHeightAtPosition(idealCameraPos.x, idealCameraPos.z);
    const minCameraHeight = terrainHeightAtCamera + 2; // Keep camera at least 2 units above ground
    if (idealCameraPos.y < minCameraHeight) {
      idealCameraPos.y = minCameraHeight;
    }
    
    // Smooth camera movement using lerp
    this.camera.position.lerp(idealCameraPos, this.cameraLerpSpeed * deltaTime);
    
    // Calculate look-at target (where camera should look)
    const lookTarget = new THREE.Vector3();
    const lookDistance = 10;
    
    // Look in the direction of yaw and pitch
    lookTarget.x = playerPos.x - Math.sin(this.yaw) * lookDistance;
    lookTarget.z = playerPos.z - Math.cos(this.yaw) * lookDistance;
    lookTarget.y = playerPos.y + this.cameraHeight - Math.sin(this.pitch) * lookDistance;
    
    // Make camera look at the target
    this.camera.lookAt(lookTarget);
  }

  public update(deltaTime: number, inputManager: InputManager3D): void {
    this.handleMouseLook(inputManager);
    this.handleMovement(deltaTime, inputManager);
    this.applyGravityAndTerrainCollision(deltaTime);
    this.updateCameraPosition();
  }

  private handleMovement(deltaTime: number, inputManager: InputManager3D): void {
    const moveVector = new THREE.Vector3();
    
    // Get input
    if (inputManager.isPressed('KeyW')) moveVector.z += 1;
    if (inputManager.isPressed('KeyS')) moveVector.z -= 1;
    if (inputManager.isPressed('KeyA')) moveVector.x -= 1;
    if (inputManager.isPressed('KeyD')) moveVector.x += 1;
    
    if (moveVector.length() > 0) {
      moveVector.normalize();
      
      // Calculate movement relative to camera yaw
      const cameraYawOnly = this.yaw;
      
      // Forward/backward relative to camera direction
      const forward = new THREE.Vector3(
        -Math.sin(cameraYawOnly),
        0,
        -Math.cos(cameraYawOnly)
      );
      
      // Right/left relative to camera direction
      const right = new THREE.Vector3(
        Math.cos(cameraYawOnly),
        0,
        -Math.sin(cameraYawOnly)
      );
      
      // Calculate final movement direction
      const movement = new THREE.Vector3();
      movement.addScaledVector(forward, moveVector.z);
      movement.addScaledVector(right, moveVector.x);
      movement.multiplyScalar(this.moveSpeed * deltaTime);
      
      // Apply movement with smooth interpolation
      const newPosition = this.playerMesh.position.clone().add(movement);
      this.playerMesh.position.lerp(newPosition, 0.9);
      
      // Rotate player to face movement direction (smooth rotation)
      if (movement.length() > 0) {
        const targetRotation = Math.atan2(movement.x, movement.z);
        this.playerMesh.rotation.y = this.lerpAngle(
          this.playerMesh.rotation.y, 
          targetRotation, 
          deltaTime * this.rotationLerpSpeed
        );
      }
    }
    
    // Jump
    if (inputManager.isPressed('Space') && this.isGrounded) {
      this.velocity.y = this.jumpSpeed;
      this.isGrounded = false;
    }
  }

  private handleMouseLook(inputManager: InputManager3D): void {
    const mouseDelta = inputManager.getMouseDelta();
    
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
      // Update yaw (horizontal rotation)
      this.yaw -= mouseDelta.x * this.mouseSensitivity;
      
      // Update pitch (vertical rotation)
      this.pitch += mouseDelta.y * this.mouseSensitivity;
      
      // Clamp pitch to prevent camera flipping
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
      
      // Normalize yaw to prevent overflow
      this.yaw = this.yaw % (Math.PI * 2);
    }
  }

  private lerpAngle(from: number, to: number, t: number): number {
    // Handle angle wrapping for smooth rotation
    let diff = to - from;
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return from + diff * t;
  }

  private applyGravityAndTerrainCollision(deltaTime: number): void {
    // Get terrain height at player position
    const terrainHeight = this.getTerrainHeightAtPosition(
      this.playerMesh.position.x, 
      this.playerMesh.position.z
    );

    // Player capsule: radius = 0.5, height = 1.8
    // Bottom of capsule is at position.y - (height/2 + radius) = position.y - 1.4
    const playerBottomY = terrainHeight + 1.4; // Proper height offset for capsule

    if (this.playerMesh.position.y <= playerBottomY) {
      // Player is on or below ground
      this.playerMesh.position.y = playerBottomY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      // Player is in the air - apply gravity
      this.isGrounded = false;
      this.velocity.y -= 25 * deltaTime; // Gravity
      this.playerMesh.position.y += this.velocity.y * deltaTime;
    }
  }

  private getTerrainHeightAtPosition(x: number, z: number): number {
    if (this.terrainHeightFunction) {
      return this.terrainHeightFunction(x, z);
    }
    
    // Fallback: use raycasting to find terrain height
    this.raycaster.set(
      new THREE.Vector3(x, 1000, z), // Start high above
      new THREE.Vector3(0, -1, 0)    // Point downward
    );

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    for (const intersect of intersects) {
      // Check if this is terrain (not player, enemies, etc.)
      if (intersect.object.material && 
          intersect.object !== this.playerMesh &&
          !intersect.object.userData.isEnemy &&
          !intersect.object.userData.isProjectile) {
        return intersect.point.y;
      }
    }
    
    return 0; // Default ground level
  }

  public getPosition(): THREE.Vector3 {
    return this.playerMesh.position.clone();
  }

  public getDirection(): THREE.Vector3 {
    // Return camera look direction for aiming
    const direction = new THREE.Vector3();
    
    // Calculate direction based on yaw and pitch
    direction.x = -Math.sin(this.yaw) * Math.cos(this.pitch);
    direction.y = -Math.sin(this.pitch);
    direction.z = -Math.cos(this.yaw) * Math.cos(this.pitch);
    
    return direction.normalize();
  }

  public getForwardDirection(): THREE.Vector3 {
    // Return player facing direction (for movement)
    return new THREE.Vector3(
      Math.sin(this.playerMesh.rotation.y),
      0,
      Math.cos(this.playerMesh.rotation.y)
    );
  }

  public getCameraYaw(): number {
    return this.yaw;
  }

  public getCameraPitch(): number {
    return this.pitch;
  }

  public getShoulderPosition(): THREE.Vector3 {
    // Get weapon firing position (from shoulder)
    const playerPos = this.playerMesh.position.clone();
    const rightVector = new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const shoulderPos = playerPos.clone();
    shoulderPos.add(rightVector.multiplyScalar(0.5)); // Right shoulder
    shoulderPos.y += 1.5; // Shoulder height
    return shoulderPos;
  }
}