import axios from "axios";
import "./App.css";
import Map from "./pages/map";
import Treemap from "./pages/treemap";
import type { Country, CovidCase, CovidData } from "./types/data";
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

      const countriesResponse = await axios.get("/odata/Countries");
      const countries: Country[] = countriesResponse.data.value;

      const countryMap: Record<number, Country> = {};
      countries.forEach((country) => {
        countryMap[country.Id] = country;
      });

      const covidResponse = await axios.get("/odata/CovidCases");
      const covidCases: CovidCase[] = covidResponse.data.value;
      const latestByCountry: Record<string, CovidData> = {};

      covidCases.forEach((covidCase) => {
        const country = countryMap[covidCase.CountryId];

        if (!country) {
          return;
        }
        const countryName = country.CountryName;
        const currentReportDate = covidCase.ReportDate || "";
        const existingReportDate =
          latestByCountry[countryName]?.reportDate || "";

        if (
          !latestByCountry[countryName] ||
          new Date(currentReportDate) > new Date(existingReportDate)
        ) {
          latestByCountry[countryName] = {
            countryName: country.CountryName,
            countryCode: country.CountryCode,
            confirmed: covidCase.Confirmed || 0,
            deaths: covidCase.Deaths || 0,
            recovered: covidCase.Recovered || 0,
            active: covidCase.Active || 0,
            dailyConfirmed: covidCase.DailyConfirmed || 0,
            dailyDeaths: covidCase.DailyDeaths || 0,
            reportDate: covidCase.ReportDate,
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
