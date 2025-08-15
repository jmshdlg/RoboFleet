import { describe, it, expect, beforeEach } from "vitest";

interface RobotCapabilities {
  batteryLife: bigint;
  payloadCapacity: bigint;
  speed: bigint;
  sensorType: string;
}

interface MockContract {
  admin: string;
  paused: boolean;
  nextRobotId: bigint;
  robotOwners: Map<bigint, string>;
  robotStatuses: Map<bigint, boolean>;
  robotCapabilities: Map<bigint, RobotCapabilities>;
  approvals: Map<string, boolean>;
  robotCount: bigint;
  allRobots: Map<bigint, bigint>;

  isAdmin(caller: string): boolean;
  setPaused(caller: string, pause: boolean): { value: boolean } | { error: number };
  registerRobot(
    caller: string,
    batteryLife: bigint,
    payloadCapacity: bigint,
    speed: bigint,
    sensorType: string
  ): { value: bigint } | { error: number };
  updateStatus(caller: string, robotId: bigint, active: boolean): { value: boolean } | { error: number };
  updateCapabilities(
    caller: string,
    robotId: bigint,
    batteryLife: bigint,
    payloadCapacity: bigint,
    speed: bigint,
    sensorType: string
  ): { value: boolean } | { error: number };
  approve(caller: string, robotId: bigint, operator: string): { value: boolean } | { error: number };
  revokeApproval(caller: string, robotId: bigint, operator: string): { value: boolean } | { error: number };
  transferOwnership(caller: string, robotId: bigint, newOwner: string): { value: boolean } | { error: number };
  getOwner(robotId: bigint): string | undefined;
  getStatus(robotId: bigint): boolean;
  getCapabilities(robotId: bigint): RobotCapabilities | undefined;
  isApproved(robotId: bigint, operator: string): boolean;
  getRobotCount(): bigint;
  getRobotByIndex(index: bigint): bigint | undefined;
  findRobotsByCapacity(minCapacity: bigint): bigint[];
}

const mockContract: MockContract = {
  admin: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  paused: false,
  nextRobotId: 1n,
  robotOwners: new Map<bigint, string>(),
  robotStatuses: new Map<bigint, boolean>(),
  robotCapabilities: new Map<bigint, RobotCapabilities>(),
  approvals: new Map<string, boolean>(),
  robotCount: 0n,
  allRobots: new Map<bigint, bigint>(),

  isAdmin(caller: string) {
    return caller === this.admin;
  },

  setPaused(caller: string, pause: boolean) {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },

  registerRobot(
    caller: string,
    batteryLife: bigint,
    payloadCapacity: bigint,
    speed: bigint,
    sensorType: string
  ) {
    if (this.paused) return { error: 104 };
    if (batteryLife <= 0n || payloadCapacity <= 0n || speed <= 0n) return { error: 106 };
    if (sensorType.length === 0 || sensorType.length > 32) return { error: 110 };
    const robotId = this.nextRobotId;
    if (this.robotOwners.has(robotId)) return { error: 102 };
    this.robotOwners.set(robotId, caller);
    this.robotStatuses.set(robotId, true);
    this.robotCapabilities.set(robotId, {
      batteryLife,
      payloadCapacity,
      speed,
      sensorType,
    });
    this.allRobots.set(this.robotCount, robotId);
    this.robotCount += 1n;
    this.nextRobotId += 1n;
    return { value: robotId };
  },

  updateStatus(caller: string, robotId: bigint, active: boolean) {
    if (this.paused) return { error: 104 };
    if (!this.robotOwners.has(robotId)) return { error: 101 };
    if (this.robotOwners.get(robotId) !== caller) return { error: 107 };
    this.robotStatuses.set(robotId, active);
    return { value: true };
  },

  updateCapabilities(
    caller: string,
    robotId: bigint,
    batteryLife: bigint,
    payloadCapacity: bigint,
    speed: bigint,
    sensorType: string
  ) {
    if (this.paused) return { error: 104 };
    if (!this.robotOwners.has(robotId)) return { error: 101 };
    if (this.robotOwners.get(robotId) !== caller) return { error: 107 };
    if (batteryLife <= 0n || payloadCapacity <= 0n || speed <= 0n) return { error: 106 };
    if (sensorType.length === 0 || sensorType.length > 32) return { error: 110 };
    this.robotCapabilities.set(robotId, {
      batteryLife,
      payloadCapacity,
      speed,
      sensorType,
    });
    return { value: true };
  },

  approve(caller: string, robotId: bigint, operator: string) {
    if (this.paused) return { error: 104 };
    if (!this.robotOwners.has(robotId)) return { error: 101 };
    if (this.robotOwners.get(robotId) !== caller) return { error: 107 };
    if (operator === "SP000000000000000000002Q6VF78") return { error: 105 };
    const key = `${robotId}-${operator}`;
    this.approvals.set(key, true);
    return { value: true };
  },

  revokeApproval(caller: string, robotId: bigint, operator: string) {
    if (this.paused) return { error: 104 };
    if (!this.robotOwners.has(robotId)) return { error: 101 };
    if (this.robotOwners.get(robotId) !== caller) return { error: 107 };
    if (operator === "SP000000000000000000002Q6VF78") return { error: 105 };
    const key = `${robotId}-${operator}`;
    this.approvals.delete(key);
    return { value: true };
  },

  transferOwnership(caller: string, robotId: bigint, newOwner: string) {
    if (this.paused) return { error: 104 };
    if (!this.robotOwners.has(robotId)) return { error: 101 };
    if (newOwner === "SP000000000000000000002Q6VF78") return { error: 105 };
    const currentOwner = this.robotOwners.get(robotId)!;
    const key = `${robotId}-${caller}`;
    const isApproved = this.approvals.get(key) || false;
    if (caller !== currentOwner && !isApproved) return { error: 100 };
    this.robotOwners.set(robotId, newOwner);
    this.approvals.delete(key);
    return { value: true };
  },

  getOwner(robotId: bigint) {
    return this.robotOwners.get(robotId);
  },

  getStatus(robotId: bigint) {
    return this.robotStatuses.get(robotId) ?? false;
  },

  getCapabilities(robotId: bigint) {
    return this.robotCapabilities.get(robotId);
  },

  isApproved(robotId: bigint, operator: string) {
    const key = `${robotId}-${operator}`;
    return this.approvals.get(key) ?? false;
  },

  getRobotCount() {
    return this.robotCount;
  },

  getRobotByIndex(index: bigint) {
    return this.allRobots.get(index);
  },

  findRobotsByCapacity(minCapacity: bigint) {
    const result: bigint[] = [];
    for (let i = 0n; i < this.robotCount; i++) {
      const robotId = this.allRobots.get(i);
      if (robotId) {
        const caps = this.robotCapabilities.get(robotId);
        if (caps && caps.payloadCapacity >= minCapacity) {
          result.push(robotId);
        }
      }
    }
    return result;
  },
};

describe("RoboFleet Robot Registry", () => {
  beforeEach(() => {
    mockContract.admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    mockContract.paused = false;
    mockContract.nextRobotId = 1n;
    mockContract.robotOwners = new Map();
    mockContract.robotStatuses = new Map();
    mockContract.robotCapabilities = new Map();
    mockContract.approvals = new Map();
    mockContract.robotCount = 0n;
    mockContract.allRobots = new Map();
  });

  it("should register a new robot and update count", () => {
    const result = mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    expect(result).toEqual({ value: 1n });
    expect(mockContract.getOwner(1n)).toBe("ST2CY5...");
    expect(mockContract.getStatus(1n)).toBe(true);
    expect(mockContract.getCapabilities(1n)).toEqual({
      batteryLife: 120n,
      payloadCapacity: 5000n,
      speed: 10n,
      sensorType: "LIDAR",
    });
    expect(mockContract.getRobotCount()).toBe(1n);
    expect(mockContract.getRobotByIndex(0n)).toBe(1n);
  });

  it("should prevent registration with invalid sensor type", () => {
    const result = mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "");
    expect(result).toEqual({ error: 110 });
  });

  it("should prevent registration with invalid capacities", () => {
    const result = mockContract.registerRobot("ST2CY5...", 0n, 5000n, 10n, "LIDAR");
    expect(result).toEqual({ error: 106 });
  });

  it("should update robot status", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    const result = mockContract.updateStatus("ST2CY5...", 1n, false);
    expect(result).toEqual({ value: true });
    expect(mockContract.getStatus(1n)).toBe(false);
  });

  it("should prevent status update by non-owner", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    const result = mockContract.updateStatus("ST3NB...", 1n, false);
    expect(result).toEqual({ error: 107 });
  });

  it("should update capabilities", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    const result = mockContract.updateCapabilities("ST2CY5...", 1n, 150n, 6000n, 12n, "GPS");
    expect(result).toEqual({ value: true });
    expect(mockContract.getCapabilities(1n)).toEqual({
      batteryLife: 150n,
      payloadCapacity: 6000n,
      speed: 12n,
      sensorType: "GPS",
    });
  });

  it("should prevent capability update with invalid sensor type", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    const result = mockContract.updateCapabilities("ST2CY5...", 1n, 150n, 6000n, 12n, "");
    expect(result).toEqual({ error: 110 });
  });

  it("should approve and transfer ownership", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    mockContract.approve("ST2CY5...", 1n, "ST3NB...");
    expect(mockContract.isApproved(1n, "ST3NB...")).toBe(true);
    const transferResult = mockContract.transferOwnership("ST3NB...", 1n, "ST4JQ...");
    expect(transferResult).toEqual({ value: true });
    expect(mockContract.getOwner(1n)).toBe("ST4JQ...");
  });

  it("should prevent approval with zero address", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    const result = mockContract.approve("ST2CY5...", 1n, "SP000000000000000000002Q6VF78");
    expect(result).toEqual({ error: 105 });
  });

  it("should revoke approval", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    mockContract.approve("ST2CY5...", 1n, "ST3NB...");
    const revokeResult = mockContract.revokeApproval("ST2CY5...", 1n, "ST3NB...");
    expect(revokeResult).toEqual({ value: true });
    expect(mockContract.isApproved(1n, "ST3NB...")).toBe(false);
  });

  it("should prevent revoke approval with zero address", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    const result = mockContract.revokeApproval("ST2CY5...", 1n, "SP000000000000000000002Q6VF78");
    expect(result).toEqual({ error: 105 });
  });

  it("should prevent unauthorized transfer", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    const result = mockContract.transferOwnership("ST3NB...", 1n, "ST4JQ...");
    expect(result).toEqual({ error: 100 });
  });

  it("should not allow actions when paused", () => {
    mockContract.setPaused(mockContract.admin, true);
    const result = mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    expect(result).toEqual({ error: 104 });
  });

  it("should find robots by minimum payload capacity", () => {
    mockContract.registerRobot("ST2CY5...", 120n, 5000n, 10n, "LIDAR");
    mockContract.registerRobot("ST3NB...", 150n, 3000n, 12n, "GPS");
    const result = mockContract.findRobotsByCapacity(4000n);
    expect(result).toEqual([1n]);
  });
});