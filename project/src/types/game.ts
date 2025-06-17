export type GameState = 'menu' | 'loading' | 'playing' | 'paused' | 'gameOver';

export interface PlayerStats {
  health: number;
  armor: number;
  ammo: number;
  score: number;
  kills: number;
  level: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface GameObject3D {
  position: Vector3D;
  rotation: Vector3D;
  velocity: Vector3D;
  scale: Vector3D;
  active: boolean;
  id: string;
}

export interface Player extends GameObject3D {
  health: number;
  armor: number;
  weapon: Weapon;
  isMoving: boolean;
  isJumping: boolean;
  team: 'blue' | 'red';
}

export interface Enemy extends GameObject3D {
  health: number;
  maxHealth: number;
  attackDamage: number;
  detectionRange: number;
  attackRange: number;
  speed: number;
  type: 'drone' | 'walker' | 'turret' | 'boss';
  lastAttack: number;
  target: string | null;
}

export interface Weapon {
  name: string;
  damage: number;
  fireRate: number;
  range: number;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  lastFired: number;
  type: 'plasma' | 'laser' | 'projectile' | 'energy';
}

export interface Projectile extends GameObject3D {
  damage: number;
  speed: number;
  range: number;
  owner: string;
  distanceTraveled: number;
}

export interface TerrainChunk {
  x: number;
  z: number;
  vertices: Float32Array;
  indices: Uint16Array;
  generated: boolean;
}

export interface NetworkMessage {
  type: 'playerUpdate' | 'enemyUpdate' | 'projectile' | 'hit' | 'join' | 'leave';
  data: any;
  timestamp: number;
  playerId: string;
}