export type Point = { x: number; y: number };

export type Costs = {
  perBlock: number;
  perVehicle: number;
  perMinute: number;
  perFailure: number;
  // Evento 1: cada minuto que espera un pedido premium desde la salida.
  perPremiumMinute: number;
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

export type Order = {
  id: number;
  position: Point;
  weight: number;
  premium: boolean;
};

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
