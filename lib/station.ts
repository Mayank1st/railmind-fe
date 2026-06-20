import { api } from "./api";

export type Station = {
  station_code: string;
  station_name: string;
};

// GET /stations/{code}/cluster — the nearby-station group a station belongs to.
export type StationCluster = {
  station_code: string;
  in_cluster: boolean;
  cluster_code: string | null;
  cluster_name: string | null;
  primary_station: { code: string; name: string } | null;
  members: { code: string; name: string }[];
  also_covered: string[];
};

export const stationApi = {
  getAll: () =>
    api.get<{ data: Station[] }>("/common/stations").then((r) => r.data.data),

  cluster: (code: string) =>
    api
      .get<{ data: StationCluster }>(`/stations/${code}/cluster`)
      .then((r) => r.data.data),
};
