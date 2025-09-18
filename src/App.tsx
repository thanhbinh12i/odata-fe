/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import "./App.css";
import Map from "./pages/map";
import Treemap from "./pages/treemap";
import type { CovidData } from "./types/data";
import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState<CovidData[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/odata/CovidCases");

      const latestByCountry: Record<string, CovidData> = {};

      response.data.forEach((item: any) => {
        const countryName = item.country?.countryName || item.countryName;
        const countryCode = item.country?.countryCode || item.countryCode;

        const currentReportDate = item.reportDate || "";
        const existingReportDate =
          latestByCountry[countryName]?.reportDate || "";

        if (
          !latestByCountry[countryName] ||
          new Date(currentReportDate) > new Date(existingReportDate)
        ) {
          latestByCountry[countryName] = {
            countryName: countryName,
            countryCode: countryCode,
            confirmed: item.confirmed || 0,
            deaths: item.deaths || 0,
            recovered: item.recovered || 0,
            active: item.active || 0,
            dailyConfirmed: item.dailyConfirmed || 0,
            dailyDeaths: item.dailyDeaths || 0,
            reportDate: item.reportDate,
          };
        }
      });

      const mapped: CovidData[] = Object.values(latestByCountry);
      setData(mapped);
    } catch (error) {
      console.error("Error fetching COVID data:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Map data={data} loading={loading} />
      <Treemap data={data} loading={loading} />
    </>
  );
}

export default App;
