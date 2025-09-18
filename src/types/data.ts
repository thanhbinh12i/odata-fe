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

export interface Country {
  Id: number;
  CountryCode: string;
  CountryName: string;
  Region?: string;
  Population?: number;
}

export interface CovidCase {
  Id: number;
  CountryId: number;
  ReportDate: string;
  Confirmed: number;
  Deaths: number;
  Recovered: number;
  Active: number;
  DailyConfirmed: number;
  DailyDeaths: number;
}

export type TabType = "confirmed" | "active" | "recovered" | "deaths" | "daily";
