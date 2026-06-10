import { api } from "./api";

export type Station = {
  station_code: string;
  station_name: string;
};

export const stationApi = {
  getAll: () =>
    api.get<{ data: Station[] }>("/common/stations").then((r) => r.data.data),
};
