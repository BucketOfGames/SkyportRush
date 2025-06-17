import * as THREE from 'three';

interface Enemy {
  mesh: THREE.Mesh;
  health: number;
  maxHealth: number;
  speed: number;
  lastAttack: number;
  type: 'drone' | 'walker' | 'turret';
  id: string;
  destroyed: boolean;
}

export class EnemyManager {
  private scene: THREE.Scene;
  private enemies: Enemy[] = [];
  private enemyCount: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnWave(count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    const types: ('drone' | 'walker' | 'turret')[] = ['drone', 'walker', 'turret'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const enemy = this.createEnemyMesh(type);
    
    // Random spawn position around the player
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    enemy.mesh.position.set(
      Math.cos(angle) * distance,
      2,
      Math.sin(angle) * distance
    );

    this.enemies.push(enemy);
    this.scene.add(enemy.mesh);
  }

  private createEnemyMesh(type: 'drone' | 'walker' | 'turret'): Enemy {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let health: number;
    let speed: number;

    switch (type) {
      case 'drone':
        geometry = new THREE.SphereGeometry(0.8, 8, 6);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xff4444,
          emissive: 0x440000
        });
        health = 50;
        speed = 8;
        break;
      
      case 'walker':
        geometry = new THREE.BoxGeometry(1.5, 2, 1.5);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xff8844,
          emissive: 0x442200
        });
        health = 100;
        speed = 4;
        break;
      
      case 'turret':
        geometry = new THREE.CylinderGeometry(1, 1.5, 1.5, 8);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x8844ff,
          emissive: 0x220044
        });
        health = 150;
        speed = 0;
        break;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add glowing eyes/sensors
    const eyeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    
    leftEye.position.set(-0.3, 0.2, 0.5);
    rightEye.position.set(0.3, 0.2, 0.5);
    
    mesh.add(leftEye);
    mesh.add(rightEye);

    const enemy: Enemy = {
      mesh,
      health,
      maxHealth: health,
      speed,
      lastAttack: 0,
      type,
      id: `enemy_${this.enemyCount++}`,
      destroyed: false
    };

    mesh.userData = { id: enemy.id };
    
    return enemy;
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    this.enemies.forEach(enemy => {
      if (enemy.health <= 0 || enemy.destroyed) return;

      const direction = new THREE.Vector3();
      direction.subVectors(playerPosition, enemy.mesh.position);
      direction.y = 0;
      direction.normalize();

      // Move towards player
      if (enemy.speed > 0) {
        const movement = direction.multiplyScalar(enemy.speed * deltaTime);
        enemy.mesh.position.add(movement);
      }

      // Look at player
      enemy.mesh.lookAt(playerPosition);

      // Attack logic
      const distance = enemy.mesh.position.distanceTo(playerPosition);
      if (distance < 10 && Date.now() - enemy.lastAttack > 2000) {
        this.enemyAttack(enemy);
        enemy.lastAttack = Date.now();
      }
    });

    // Remove destroyed enemies
    this.enemies = this.enemies.filter(enemy => {
      if (enemy.health <= 0 || enemy.destroyed) {
        this.scene.remove(enemy.mesh);
        return false;
      }
      return true;
    });
  }

  private enemyAttack(enemy: Enemy): void {
    // Create attack effect
    const geometry = new THREE.SphereGeometry(0.2, 8, 6);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.copy(enemy.mesh.position);
    this.scene.add(projectile);

    // Animate projectile (simplified)
    setTimeout(() => {
      this.scene.remove(projectile);
    }, 1000);
  }

  public damageEnemy(enemyId: string, damage: number): void {
    const enemy = this.enemies.find(e => e.id === enemyId);
    if (enemy && !enemy.destroyed) {
      enemy.health -= damage;
      
      // Visual damage feedback
      const originalColor = (enemy.mesh.material as THREE.MeshPhongMaterial).color.clone();
      (enemy.mesh.material as THREE.MeshPhongMaterial).color.setHex(0xffffff);
      
      setTimeout(() => {
        if (!enemy.destroyed) {
          (enemy.mesh.material as THREE.MeshPhongMaterial).color.copy(originalColor);
        }
      }, 100);

      // Mark as destroyed if health reaches 0
      if (enemy.health <= 0) {
        enemy.destroyed = true;
      }
    }
  }

  public isEnemyDestroyed(enemyId: string): boolean {
    const enemy = this.enemies.find(e => e.id === enemyId);
    return enemy ? enemy.destroyed : false;
  }

  public getEnemies(): THREE.Mesh[] {
    return this.enemies.filter(e => !e.destroyed).map(enemy => enemy.mesh);
  }
}