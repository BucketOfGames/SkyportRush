import * as THREE from 'three';

export class TerrainGenerator {
  private scene: THREE.Scene;
  private chunks: Map<string, THREE.Mesh> = new Map();
  private chunkSize: number = 50;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public generateChunk(chunkX: number, chunkZ: number): void {
    const key = `${chunkX}_${chunkZ}`;
    if (this.chunks.has(key)) return;

    const geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, 32, 32);
    
    // Apply procedural height map
    const vertices = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i] + chunkX * this.chunkSize;
      const z = vertices[i + 2] + chunkZ * this.chunkSize;
      
      // Simple noise function for terrain height
      vertices[i + 1] = this.noise(x * 0.02, z * 0.02) * 5;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Create material with sci-fi appearance
    const material = new THREE.MeshPhongMaterial({
      color: 0x2a4a6b,
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(chunkX * this.chunkSize, 0, chunkZ * this.chunkSize);
    mesh.receiveShadow = true;

    // Add some sci-fi structures
    this.addStructures(mesh, chunkX, chunkZ);

    this.chunks.set(key, mesh);
    this.scene.add(mesh);
  }

  private addStructures(terrainMesh: THREE.Mesh, chunkX: number, chunkZ: number): void {
    // Add random sci-fi structures
    const structureCount = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < structureCount; i++) {
      const x = (Math.random() - 0.5) * this.chunkSize;
      const z = (Math.random() - 0.5) * this.chunkSize;
      
      // Create different types of structures
      const structureType = Math.floor(Math.random() * 3);
      let structure: THREE.Mesh;

      switch (structureType) {
        case 0: // Tower
          const towerGeometry = new THREE.CylinderGeometry(1, 2, 8, 8);
          const towerMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4a6b8a,
            emissive: 0x001122
          });
          structure = new THREE.Mesh(towerGeometry, towerMaterial);
          structure.position.set(x, 4, z);
          break;

        case 1: // Crystal
          const crystalGeometry = new THREE.ConeGeometry(1.5, 6, 6);
          const crystalMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x6a4a8a,
            emissive: 0x220044,
            transparent: true,
            opacity: 0.8
          });
          structure = new THREE.Mesh(crystalGeometry, crystalMaterial);
          structure.position.set(x, 3, z);
          break;

        case 2: // Platform
          const platformGeometry = new THREE.BoxGeometry(4, 0.5, 4);
          const platformMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8a6a4a,
            emissive: 0x442200
          });
          structure = new THREE.Mesh(platformGeometry, platformMaterial);
          structure.position.set(x, 0.25, z);
          break;

        default:
          continue;
      }

      structure.castShadow = true;
      structure.receiveShadow = true;
      terrainMesh.add(structure);
    }
  }

  private noise(x: number, y: number): number {
    // Simple noise function
    return Math.sin(x) * Math.cos(y) + Math.sin(x * 2) * Math.cos(y * 2) * 0.5;
  }

  public hasChunk(chunkX: number, chunkZ: number): boolean {
    return this.chunks.has(`${chunkX}_${chunkZ}`);
  }
}