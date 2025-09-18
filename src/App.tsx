import axios from "axios";
import "./App.css";
import Map from "./pages/map";
import Treemap from "./pages/treemap";
import type { Country, CovidCase, CovidData } from "./types/data";
import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState<CovidData[]>([]);
  const [allDataByDate, setAllDataByDate] = useState<
    Record<string, CovidData[]>
  >({});
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate && allDataByDate[selectedDate]) {
      setData(allDataByDate[selectedDate]);
    }
  }, [selectedDate, allDataByDate]);

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

      const dataByDate: Record<string, CovidData[]> = {};
      const dateSet = new Set<string>();

      covidCases.forEach((covidCase) => {
        const country = countryMap[covidCase.CountryId];
        if (!country) return;

        const date = covidCase.ReportDate?.split("T")[0] || "";
        if (date) {
          dateSet.add(date);

          if (!dataByDate[date]) {
            dataByDate[date] = [];
          }

          dataByDate[date].push({
            countryName: country.CountryName,
            countryCode: country.CountryCode,
            confirmed: covidCase.Confirmed || 0,
            deaths: covidCase.Deaths || 0,
            recovered: covidCase.Recovered || 0,
            active: covidCase.Active || 0,
            dailyConfirmed: covidCase.DailyConfirmed || 0,
            dailyDeaths: covidCase.DailyDeaths || 0,
            reportDate: covidCase.ReportDate,
          });
        }
      });

      const sortedDates = Array.from(dateSet).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );

      setDates(sortedDates);
      setAllDataByDate(dataByDate);

      if (sortedDates.length > 0) {
        setSelectedDate(sortedDates[0]);
      }
    } catch (error) {
      console.error("Error fetching COVID data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white shadow-md p-4 mb-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <label className="font-semibold text-gray-700">Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Map data={data} loading={loading} />
      <Treemap data={data} loading={loading} />
    </>
  );
}

export default App;
