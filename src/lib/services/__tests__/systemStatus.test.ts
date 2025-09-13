import { describe, it, expect, vi, beforeEach } from 'vitest';
import { systemStatusService } from '../systemStatus';
import * as apiUtils from '../../utils/api';

// Mock the API module
vi.mock('../../utils/api', () => ({
  get: vi.fn()
}));

describe('SystemStatusService', () => {
  const mockGet = vi.mocked(apiUtils.get);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSystemStatus', () => {
    it('should fetch and return system status correctly', async () => {
      const mockResponse = [
        {
          dispenser_controller: true,
          dispenser_status: {
            'door-opened': false,
            'drawers-unlocked': false,
            'hatch-opened': false
          },
          internet_connectivity: true,
          out_of_service: false,
          smartlocker_controller: false
        },
        {
          timestamp: '2025-09-13T12:33:05.980'
        }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.getSystemStatus();

      expect(result).toEqual({
        status: mockResponse[0],
        timestamp: mockResponse[1].timestamp
      });

      expect(mockGet).toHaveBeenCalledWith('/status');
    });

    it('should throw error for invalid response format', async () => {
      mockGet.mockResolvedValue({ invalid: 'format' });

      await expect(systemStatusService.getSystemStatus()).rejects.toThrow('Invalid system status response format');
    });
  });

  describe('checkSystemBlocking', () => {
    it('should return not blocked when all systems are operational', async () => {
      const mockResponse = [
        {
          dispenser_controller: true,
          dispenser_status: {
            'door-opened': false,
            'drawers-unlocked': false,
            'hatch-opened': false
          },
          internet_connectivity: true,
          out_of_service: false
        },
        { timestamp: '2025-09-13T12:33:05.980' }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.checkSystemBlocking();

      expect(result.isBlocked).toBe(false);
      expect(result.reasons).toEqual([]);
    });

    it('should return blocked with correct reasons when dispenser controller fails', async () => {
      const mockResponse = [
        {
          dispenser_controller: false,
          internet_connectivity: true,
          out_of_service: false
        },
        { timestamp: '2025-09-13T12:33:05.980' }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.checkSystemBlocking();

      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Falha de comunicação com controlador');
    });

    it('should return blocked when internet connectivity fails', async () => {
      const mockResponse = [
        {
          dispenser_controller: true,
          internet_connectivity: false,
          out_of_service: false
        },
        { timestamp: '2025-09-13T12:33:05.980' }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.checkSystemBlocking();

      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Falha de acesso à Internet');
    });

    it('should return blocked when out of service', async () => {
      const mockResponse = [
        {
          dispenser_controller: true,
          internet_connectivity: true,
          out_of_service: true
        },
        { timestamp: '2025-09-13T12:33:05.980' }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.checkSystemBlocking();

      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Equipamento em manutenção');
    });

    it('should return blocked when dispenser status has issues', async () => {
      const mockResponse = [
        {
          dispenser_controller: true,
          internet_connectivity: true,
          out_of_service: false,
          dispenser_status: {
            'door-opened': true,
            'drawers-unlocked': true,
            'hatch-opened': false
          }
        },
        { timestamp: '2025-09-13T12:33:05.980' }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.checkSystemBlocking();

      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Porta aberta');
      expect(result.reasons).toContain('Gavetas destravadas');
      expect(result.reasons).not.toContain('Portinhola aberta');
    });

    it('should return blocked with multiple reasons', async () => {
      const mockResponse = [
        {
          dispenser_controller: false,
          internet_connectivity: false,
          out_of_service: true,
          dispenser_status: {
            'door-opened': true,
            'drawers-unlocked': false,
            'hatch-opened': true
          }
        },
        { timestamp: '2025-09-13T12:33:05.980' }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.checkSystemBlocking();

      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Falha de comunicação com controlador');
      expect(result.reasons).toContain('Falha de acesso à Internet');
      expect(result.reasons).toContain('Equipamento em manutenção');
      expect(result.reasons).toContain('Porta aberta');
      expect(result.reasons).toContain('Portinhola aberta');
      expect(result.reasons).not.toContain('Gavetas destravadas');
    });

    it('should return blocked on API error', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await systemStatusService.checkSystemBlocking();

      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Erro de comunicação com o sistema');
    });
  });

  describe('isSystemReady', () => {
    it('should return true when system is not blocked', async () => {
      const mockResponse = [
        {
          dispenser_controller: true,
          internet_connectivity: true,
          out_of_service: false
        },
        { timestamp: '2025-09-13T12:33:05.980' }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.isSystemReady();

      expect(result).toBe(true);
    });

    it('should return false when system is blocked', async () => {
      const mockResponse = [
        {
          dispenser_controller: false,
          internet_connectivity: true,
          out_of_service: false
        },
        { timestamp: '2025-09-13T12:33:05.980' }
      ];

      mockGet.mockResolvedValue(mockResponse);

      const result = await systemStatusService.isSystemReady();

      expect(result).toBe(false);
    });
  });
});