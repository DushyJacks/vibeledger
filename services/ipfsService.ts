import { create, IPFSHTTPClient } from 'ipfs-http-client';

/**
 * IPFS Service for decentralized file storage
 * For production hackathon demo, using mock IPFS hashes
 * Can be upgraded to use Pinata/Web3.Storage with API keys
 */
class IPFSService {
  private client: IPFSHTTPClient | null = null;

  constructor() {
    // Only use client if proper API is configured
    const apiUrl = (import.meta as any).env?.VITE_IPFS_API_URL;
    const apiToken = (import.meta as any).env?.VITE_IPFS_API_TOKEN;

    // Skip client initialization - use mock hashes for demo
    if (apiUrl && apiToken) {
      try {
        const url = new URL(apiUrl);
        const headers: Record<string, string> = {};
        if (apiToken) {
          headers.Authorization = `Bearer ${apiToken}`;
        }

        this.client = create({
          host: url.hostname,
          port: Number(url.port) || (url.protocol === 'https:' ? 443 : 80),
          protocol: url.protocol.replace(':', ''),
          headers
        });
        console.log('IPFS client initialized with custom API');
      } catch (error) {
        console.warn('IPFS client initialization failed. Using mock hashes.', error);
      }
    } else {
      console.log('No IPFS API configured. Using mock hashes for demo.');
    }
  }

  /**
   * Upload file to IPFS
   * Returns the IPFS hash (CID)
   */
  async uploadFile(file: File): Promise<string> {
    try {
      if (!this.client) {
        console.log('Using mock IPFS hash for file:', file.name);
        return this.generateMockHash();
      }

      const buffer = await file.arrayBuffer();
      const result = await this.client.add(Buffer.from(buffer));
      
      return result.path; // Returns the CID (Content Identifier)
    } catch (error) {
      console.error('IPFS upload error:', error);
      // Fallback to mock hash
      return this.generateMockHash();
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(data: any): Promise<string> {
    try {
      if (!this.client) {
        console.log('Using mock IPFS hash for JSON metadata');
        return this.generateMockHash();
      }

      const jsonString = JSON.stringify(data);
      const result = await this.client.add(jsonString);
      
      return result.path;
    } catch (error) {
      console.error('IPFS JSON upload error:', error);
      return this.generateMockHash();
    }
  }

  /**
   * Get IPFS gateway URL for a hash
   */
  getGatewayUrl(hash: string): string {
    const gateway = (import.meta as any).env?.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    return `${gateway.replace(/\/$/, '')}/${hash}`;
  }

  /**
   * Upload audio file to IPFS
   */
  async uploadAudio(file: File): Promise<{ hash: string; url: string }> {
    const hash = await this.uploadFile(file);
    const url = this.getGatewayUrl(hash);
    
    return { hash, url };
  }

  /**
   * Upload track metadata (including cover art) to IPFS
   */
  async uploadTrackMetadata(metadata: {
    title: string;
    artist: string;
    genre: string;
    coverArtHash?: string;
    audioHash?: string;
    creators: any[];
  }): Promise<string> {
    return await this.uploadJSON(metadata);
  }

  /**
   * Generate a mock IPFS hash for development/fallback
   */
  private generateMockHash(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let hash = 'Qm';
    for (let i = 0; i < 44; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Check if IPFS client is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }
}

export const ipfsService = new IPFSService();
