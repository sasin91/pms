import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { ERROR_MESSAGES } from './error-messages';

@Injectable()
export class ResilienceSimulationInterceptor implements NestInterceptor {
  async intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (process.env.API_SIMULATION_ENABLED !== 'true') {
      return next.handle();
    }

    await this.sleep(this.randomLatency());

    if (Math.random() < this.failureRate()) {
      throw new ServiceUnavailableException(
        ERROR_MESSAGES.resilience.transientFailure,
      );
    }

    return next.handle();
  }

  private failureRate(): number {
    return this.clamp(Number(process.env.API_FAILURE_RATE ?? 0.05), 0, 1);
  }

  private randomLatency(): number {
    const minimum = Math.max(Number(process.env.API_MIN_LATENCY_MS ?? 100), 0);
    const maximum = Math.max(
      Number(process.env.API_MAX_LATENCY_MS ?? 500),
      minimum,
    );

    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Number.isFinite(value)
      ? Math.min(Math.max(value, minimum), maximum)
      : minimum;
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
