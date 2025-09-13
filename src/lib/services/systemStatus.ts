import { get } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';

export interface DispenserStatus {
  'door-opened'?: boolean;
  'drawers-unlocked'?: boolean;
  'hatch-opened'?: boolean;
}

export interface SystemStatusResponse {
  dispenser_controller: boolean;
  dispenser_status?: DispenserStatus;
  internet_connectivity: boolean;
  out_of_service: boolean;
  smartlocker_controller?: boolean;
}

export interface SystemStatusData {
  status: SystemStatusResponse;
  timestamp: string;
}

export interface BlockingCondition {
  condition: string;
  message: string;
  isBlocking: boolean;
}

class SystemStatusService {
  private readonly STATUS_ENDPOINT = '/status';

  /**
   * Fetch the current system status from the API
   */
  async getSystemStatus(): Promise<SystemStatusData> {
    try {
      console.log('Fetching system status from:', `${ENDPOINTS.baseUrl}${this.STATUS_ENDPOINT}`);
      const response = await get<[SystemStatusResponse, { timestamp: string }]>(this.STATUS_ENDPOINT);
      
      if (Array.isArray(response) && response.length >= 2) {
        return {
          status: response[0],
          timestamp: response[1].timestamp
        };
      }
      
      throw new Error('Invalid system status response format');
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      throw error;
    }
  }

  /**
   * Check if the system is blocked from starting a purchase
   */
  async checkSystemBlocking(): Promise<{ isBlocked: boolean; reasons: string[] }> {
    try {
      const { status } = await this.getSystemStatus();
      const blockingConditions = this.evaluateBlockingConditions(status);
      
      const blockedConditions = blockingConditions.filter(condition => condition.isBlocking);
      const reasons = blockedConditions.map(condition => condition.message);
      
      console.log('System blocking check:', {
        isBlocked: blockedConditions.length > 0,
        reasons,
        rawStatus: status
      });

      return {
        isBlocked: blockedConditions.length > 0,
        reasons
      };
    } catch (error) {
      console.error('Error checking system blocking:', error);
      // In case of API error, assume the system is blocked to be safe
      return {
        isBlocked: true,
        reasons: ['Erro de comunicação com o sistema']
      };
    }
  }

  /**
   * Evaluate all blocking conditions based on the system status
   */
  private evaluateBlockingConditions(status: SystemStatusResponse): BlockingCondition[] {
    const conditions: BlockingCondition[] = [];

    // Check main system conditions
    conditions.push({
      condition: 'dispenser_controller',
      message: 'Falha de comunicação com controlador',
      isBlocking: !status.dispenser_controller
    });

    conditions.push({
      condition: 'internet_connectivity',
      message: 'Falha de acesso à Internet',
      isBlocking: !status.internet_connectivity
    });

    conditions.push({
      condition: 'out_of_service',
      message: 'Equipamento em manutenção',
      isBlocking: status.out_of_service
    });

    // Check dispenser status if available
    if (status.dispenser_status) {
      const dispenserStatus = status.dispenser_status;

      conditions.push({
        condition: 'door-opened',
        message: 'Porta aberta',
        isBlocking: dispenserStatus['door-opened'] === true
      });

      conditions.push({
        condition: 'drawers-unlocked',
        message: 'Gavetas destravadas',
        isBlocking: dispenserStatus['drawers-unlocked'] === true
      });

      conditions.push({
        condition: 'hatch-opened',
        message: 'Portinhola aberta',
        isBlocking: dispenserStatus['hatch-opened'] === true
      });
    }

    return conditions;
  }

  /**
   * Get all blocking conditions with their current status
   */
  async getAllConditions(): Promise<BlockingCondition[]> {
    try {
      const { status } = await this.getSystemStatus();
      return this.evaluateBlockingConditions(status);
    } catch (error) {
      console.error('Error getting all conditions:', error);
      return [{
        condition: 'system_error',
        message: 'Erro de comunicação com o sistema',
        isBlocking: true
      }];
    }
  }

  /**
   * Check if system is ready for purchase (convenience method)
   */
  async isSystemReady(): Promise<boolean> {
    const { isBlocked } = await this.checkSystemBlocking();
    return !isBlocked;
  }
}

export const systemStatusService = new SystemStatusService();

// Debug: Log system status service initialization
console.log('SystemStatusService initialized:', systemStatusService);