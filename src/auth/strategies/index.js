import {jwtAuthStrategy} from "@/auth/strategies/jwtAuthStrategy";
import {sessionAuthStrategy} from "@/auth/strategies/sessionAuthStrategy";

export function resolveAuthStrategy(policy = {}) {
  return policy.isJwt ? jwtAuthStrategy : sessionAuthStrategy;
}
