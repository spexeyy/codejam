export type Point = { x: number; y: number };

export type Costs = {
  perBlock: number;
  perVehicle: number;
  perMinute: number;
  perFailure: number;
};

export type World = {
  width: number;
  height: number;
  depot: Point;
  departure: number;
  serviceMinutes: number;
  reloadMinutes: number;
  minutesPerBlock: number;
  costs: Costs;
};

export type Order = { id: number; position: Point; weight: number };

export type Vehicle = {
  id: string;
  minutesPerBlock: number;
  fixedCost: number;
};

export type Scenario = { world: World; orders: Order[]; vehicles: Vehicle[] };

// Así se escribe en el plan una vuelta al depósito para cargar y empezar otro viaje.
export const RELOAD = "DEPOSITO";

export type Stop = number | typeof RELOAD;

export type Route = { vehicle: string; stops: Stop[] };

export type Plan = { routes: Route[] };
