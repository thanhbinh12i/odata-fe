/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import type { CovidData, TabType } from "../types/data";

interface MapProps {
  data: CovidData[];
  loading: boolean;
}

const geoUrl = "map.json";

function Map({ data, loading }: MapProps) {
  const [activeTab, setActiveTab] = useState<TabType>("confirmed");
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  const getValue = (country: CovidData): number => {
    switch (activeTab) {
      case "confirmed":
        return country.confirmed;
      case "deaths":
        return country.deaths;
      case "recovered":
        return country.recovered;
      case "active":
        return country.active;
      case "daily":
        return country.dailyConfirmed + country.dailyDeaths;
      default:
        return 0;
    }
  };

  const getColorScale = () => {
    const maxValue = Math.max(...data.map(getValue), 1);

    const colorRanges = {
      confirmed: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
      deaths: ["#f0f0f0", "#bdbdbd", "#737373", "#525252", "#000000"],
      recovered: ["#e5f5e0", "#a1d99b", "#41ab5d", "#238b45", "#005a32"],
      active: ["#deebf7", "#9ecae1", "#3182bd", "#08519c", "#08306b"],
      daily: ["#fff5eb", "#fdae6b", "#fd8d3c", "#e6550d", "#a63603"],
    };

    return scaleLinear<string>()
      .domain([0, maxValue * 0.1, maxValue * 0.3, maxValue * 0.6, maxValue])
      .range(colorRanges[activeTab]);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getTabLabel = (tab: TabType): string => {
    const labels = {
      confirmed: "Confirmed Cases",
      deaths: "Deaths",
      recovered: "Recovered",
      active: "Active Cases",
      daily: "Daily Report",
    };
    return labels[tab];
  };

  const handleMouseEnter = (
    event: React.MouseEvent,
    geo: any,
    countryData?: CovidData
  ) => {
    if (countryData) {
      let content = `${geo.properties.name}\n`;

      switch (activeTab) {
        case "confirmed":
          content += `Confirmed: ${formatNumber(countryData.confirmed)}`;
          break;
        case "deaths":
          content += `Deaths: ${formatNumber(countryData.deaths)}`;
          break;
        case "recovered":
          content += `Recovered: ${formatNumber(countryData.recovered)}`;
          break;
        case "active":
          content += `Active: ${formatNumber(countryData.active)}`;
          break;
        case "daily":
          content += `Daily Confirmed: ${formatNumber(
            countryData.dailyConfirmed
          )}\n`;
          content += `Daily Deaths: ${formatNumber(countryData.dailyDeaths)}`;
          break;
      }

      setTooltip({
        x: event.clientX,
        y: event.clientY,
        content: content,
      });
    } else {
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        content: `${geo.properties.name}: No data`,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const colorScale = getColorScale();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">COVID-19 Case</h1>
      </div>

      <div className="max-w-7xl mx-auto mb-6 px-4 md:px-6">
        <div className="flex gap-2 md:gap-3 border-b-2 border-gray-200  bg-white overflow-x-auto">
          {(
            ["confirmed", "deaths", "recovered", "active", "daily"] as TabType[]
          ).map((tab) => (
            <button
              key={tab}
              className={`
                px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all duration-300
                border-b-4 -mb-0.5 whitespace-nowrap
                ${
                  activeTab === tab
                    ? "text-blue-600 border-blue-600 bg-gray-50"
                    : "text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50"
                }
              `}
              onClick={() => setActiveTab(tab)}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8">
        <div className="relative bg-white rounded-xl shadow-2xl p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-5 text-gray-600 text-lg">
                Loading COVID-19 data...
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-hidden">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 180,
                    center: [0, 15],
                  }}
                  width={1000}
                  height={700}
                  style={{ width: "100%", height: "auto" }}
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const countryData = data.find(
                          (d) => d.countryName === geo.properties.name
                        );
                        const value = countryData ? getValue(countryData) : 0;
                        const color = value > 0 ? colorScale(value) : "#f7f7f7";

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={color}
                            stroke="#ffffff"
                            strokeWidth={0.5}
                            style={{
                              default: {
                                outline: "none",
                              },
                              hover: {
                                fill:
                                  activeTab === "deaths"
                                    ? "#666666"
                                    : activeTab === "recovered"
                                    ? "#2ca02c"
                                    : activeTab === "active"
                                    ? "#1f77b4"
                                    : activeTab === "daily"
                                    ? "#ff7f0e"
                                    : "#ff6b6b",
                                outline: "none",
                                cursor: "pointer",
                              },
                              pressed: {
                                fill:
                                  activeTab === "deaths"
                                    ? "#444444"
                                    : activeTab === "recovered"
                                    ? "#1e7e1e"
                                    : activeTab === "active"
                                    ? "#165a8a"
                                    : activeTab === "daily"
                                    ? "#cc6600"
                                    : "#ff4757",
                                outline: "none",
                              },
                            }}
                            onMouseEnter={(event) =>
                              handleMouseEnter(event, geo, countryData)
                            }
                            onMouseLeave={handleMouseLeave}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>
              </div>
            </>
          )}
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed bg-gray-900 bg-opacity-95 text-white px-3 py-2 rounded-md pointer-events-none z-50 text-sm shadow-xl"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 30,
          }}
        >
          {tooltip.content.split("\n").map((line, index) => (
            <div key={index} className="leading-relaxed">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Map;
