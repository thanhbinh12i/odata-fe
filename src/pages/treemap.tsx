import { useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import type { CovidData, TabType } from "../types/data";

interface TreemapNodeData {
  name: string;
  value: number;
  data: CovidData;
  percentage: string;
}

interface HierarchyRootData {
  name: string;
  children: TreemapNodeData[];
}

interface TreemapProps {
  data: CovidData[];
  loading: boolean;
}

function Treemap({ data, loading }: TreemapProps) {
  const [activeTab, setActiveTab] = useState<TabType>("confirmed");
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  const getValue = useCallback(
    (country: CovidData): number => {
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
    },
    [activeTab]
  );

  const getTabLabel = (tab: TabType): string => {
    const labels = {
      confirmed: "Confirmed",
      deaths: "Deaths",
      recovered: "Recovered",
      active: "Active",
      daily: "Daily Increase",
    };
    return labels[tab];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    return num.toString();
  };

  const formatFullNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getColorScheme = (tab: TabType) => {
    const schemes = {
      confirmed: d3.schemeBlues[9] || [],
      deaths: d3.schemeGreys[9] || [],
      recovered: d3.schemeGreens[9] || [],
      active: d3.schemeOranges[9] || [],
      daily: d3.schemePurples[9] || [],
    };
    return schemes[tab];
  };

  const treemapData = useMemo<d3.HierarchyRectangularNode<
    HierarchyRootData | TreemapNodeData
  > | null>(() => {
    if (data.length === 0) return null;

    const filteredData = data
      .filter((d) => getValue(d) > 0)
      .sort((a, b) => getValue(b) - getValue(a))
      .slice(0, 50);

    const total = filteredData.reduce((sum, d) => sum + getValue(d), 0);
    if (total === 0) return null;

    const hierarchyData: HierarchyRootData = {
      name: "root",
      children: filteredData.map((d) => ({
        name: d.countryName,
        value: getValue(d),
        data: d,
        percentage: ((getValue(d) / total) * 100).toFixed(1),
      })),
    };

    const root = d3
      .hierarchy<HierarchyRootData | TreemapNodeData>(hierarchyData)
      .sum((d) => (d as TreemapNodeData).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3
      .treemap<HierarchyRootData | TreemapNodeData>()
      .size([1200, 600])
      .padding(2)
      .round(true);

    return treemapLayout(root);
  }, [data, getValue]);

  type D3HierarchyNode = d3.HierarchyRectangularNode<
    HierarchyRootData | TreemapNodeData
  >;

  const handleMouseEnter = (event: React.MouseEvent, node: D3HierarchyNode) => {
    const nodeData = node.data as TreemapNodeData;

    if (nodeData && nodeData.data) {
      const countryData = nodeData.data;
      let content = `${countryData.countryName}\n`;
      content += `${nodeData.percentage}% of total\n\n`;

      switch (activeTab) {
        case "confirmed":
          content += `Confirmed: ${formatFullNumber(countryData.confirmed)}`;
          break;
        case "deaths":
          content += `Deaths: ${formatFullNumber(countryData.deaths)}`;
          break;
        case "recovered":
          content += `Recovered: ${formatFullNumber(countryData.recovered)}`;
          break;
        case "active":
          content += `Active: ${formatFullNumber(countryData.active)}`;
          break;
        case "daily":
          content += `Daily Confirmed: ${formatFullNumber(
            countryData.dailyConfirmed
          )}\n`;
          content += `Daily Deaths: ${formatFullNumber(
            countryData.dailyDeaths
          )}`;
          break;
      }

      setTooltip({
        x: event.clientX,
        y: event.clientY,
        content: content,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const colorScheme = getColorScheme(activeTab);
  const maxValue = data.length > 0 ? Math.max(...data.map(getValue)) : 0;

  const colorScale = d3
    .scaleQuantize<string>()
    .domain([0, maxValue > 0 ? maxValue : 1])
    .range(colorScheme);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-800">
          Treemap of Countries
        </h1>
        <p className="text-lg text-gray-600">
          The Treemap shows the number of Cases in Different countries
        </p>
        <p className="text-lg text-gray-600">
          and their percent of total cases worldwide
        </p>
      </div>

      <div className="max-w-7xl mx-auto mb-6 px-4 md:px-6">
        <div className="flex gap-2 md:gap-3 border-b-2 border-gray-200 overflow-x-auto bg-white rounded-t-lg">
          {(
            ["confirmed", "active", "recovered", "deaths", "daily"] as TabType[]
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
        <div className="relative bg-white rounded-b-xl shadow-2xl p-6">
          {loading ? (
            <div className="flex flex-col items-start justify-start min-h-[600px]">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-5 text-gray-600 text-lg">
                Loading COVID-19 data...
              </p>
            </div>
          ) : treemapData ? (
            <div className="w-full">
              <svg width="1200" height="600" className="mx-auto">
                {treemapData.leaves().map((node, i) => {
                  const width = node.x1 - node.x0;
                  const height = node.y1 - node.y0;

                  const fontSize = Math.max(
                    8,
                    Math.min(width / 8, height / 4, 14)
                  );

                  const nodeData = node.data as TreemapNodeData;
                  const value = nodeData.value;
                  const name = nodeData.name;
                  const percentage = nodeData.percentage;

                  return (
                    <g
                      key={i}
                      transform={`translate(${node.x0},${node.y0})`}
                      onMouseEnter={(e) => handleMouseEnter(e, node)}
                      onMouseLeave={handleMouseLeave}
                      className="cursor-pointer"
                    >
                      <rect
                        width={width}
                        height={height}
                        fill={colorScale(value)}
                        stroke="#fff"
                        strokeWidth="2"
                        className="transition-all duration-200 hover:opacity-80"
                      />

                      <text
                        x={4}
                        y={fontSize + 4}
                        textAnchor="start"
                        fill={i === 0 ? "#fff" : "#000"}
                        fontSize={fontSize}
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                        style={{
                          textShadow: "0 0 3px rgba(0,0,0,0.5)",
                        }}
                      >
                        {name}
                      </text>

                      <text
                        x={4}
                        y={fontSize * 2 + 6}
                        textAnchor="start"
                        fill={i === 0 ? "#fff" : "#000"}
                        fontSize={fontSize * 0.8}
                        className="pointer-events-none select-none"
                        style={{
                          textShadow: "0 0 3px rgba(0,0,0,0.5)",
                        }}
                      >
                        {formatNumber(value)}
                      </text>

                      <text
                        x={4}
                        y={fontSize * 3 + 8}
                        textAnchor="start"
                        fill={i === 0 ? "#fff" : "#000"}
                        fontSize={fontSize * 0.7}
                        className="pointer-events-none select-none"
                        style={{
                          textShadow: "0 0 3px rgba(0,0,0,0.5)",
                        }}
                      >
                        {percentage}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              No data available
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">
              Color Scale: {getTabLabel(activeTab)}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Low</span>
              <div className="flex">
                {colorScheme.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-4"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">High</span>
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed bg-gray-900 bg-opacity-95 text-white px-4 py-3 rounded-md pointer-events-none z-50 text-sm shadow-xl"
          style={{
            left: Math.min(tooltip.x + 10, window.innerWidth - 250),
            top: Math.min(tooltip.y - 30, window.innerHeight - 150),
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

export default Treemap;
