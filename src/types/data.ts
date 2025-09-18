export interface CovidData {
  countryName: string;
  countryCode?: string;
  confirmed: number;
  deaths: number;
  recovered: number;
  active: number;
  dailyConfirmed: number;
  dailyDeaths: number;
  reportDate?: string;
}

export type TabType = "confirmed" | "active" | "recovered" | "deaths" | "daily";
