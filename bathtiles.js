var dx = 35;
var CELL_SIZE = 14;
var NUMBER_OF_COLORS = 5;
var WIDTH = 900
var HEIGHT = 100
var LEGEND_WIDTH = 800
var LEGEND_HEIGHT = 12
var FONT_SIZE = 12

class Bathtiles {
    constructor(json = null, mainColor = '#4CAF50') {
        console.log('Bathtiles.js - Constructing...')
        this.data = formatData(json);
        this.mainColor = mainColor;
        this.colors = this.generateColorScheme(this.mainColor, NUMBER_OF_COLORS);
    }

    injectTooltipStyles() {
        const styles = `
            .tippy-box[data-animation=fade][data-state=hidden]{opacity:0}
            [data-tippy-root]{max-width:calc(100vw - 10px)}
            .tippy-box{position:relative;background-color:#333;color:#fff;border-radius:4px;font-size:14px;line-height:1.4;outline:0;transition-property:transform,visibility,opacity}
            .tippy-box[data-placement^=top]>.tippy-arrow{bottom:0}
            .tippy-box[data-placement^=top]>.tippy-arrow:before{bottom:-7px;left:0;border-width:8px 8px 0;border-top-color:initial;transform-origin:center top}
            .tippy-box[data-placement^=bottom]>.tippy-arrow{top:0}
            .tippy-box[data-placement^=bottom]>.tippy-arrow:before{top:-7px;left:0;border-width:0 8px 8px;border-bottom-color:initial;transform-origin:center bottom}
            .tippy-box[data-placement^=left]>.tippy-arrow{right:0}
            .tippy-box[data-placement^=left]>.tippy-arrow:before{border-width:8px 0 8px 8px;border-left-color:initial;right:-7px;transform-origin:center left}
            .tippy-box[data-placement^=right]>.tippy-arrow{left:0}
            .tippy-box[data-placement^=right]>.tippy-arrow:before{left:-7px;border-width:8px 8px 8px 0;border-right-color:initial;transform-origin:center right}
            .tippy-box[data-inertia][data-state=visible]{transition-timing-function:cubic-bezier(.54,1.5,.38,1.11)}
            .tippy-arrow{width:16px;height:16px;color:#333}
            .tippy-arrow:before{content:"";position:absolute;border-color:transparent;border-style:solid}
            .tippy-content{position:relative;padding:5px 9px;z-index:1;}
        `;

        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
    }

    generateColorScheme(baseColor, numColors) {
        const colorScale = d3.scaleSequential(d3.interpolateRgb("#eee", baseColor)).domain([0, numColors-1]);
        return Array.from({ length: numColors }, (_, i) => colorScale(i));
    }

    load(target) {
        console.log('Bathtiles.js - Loading...')
        const daysOfWeek = ['','Mon', '', 'Wed', '', 'Fri', ''];
        // Clear existing heatmap elements
        d3.select('#js-heatmap').selectAll('*').remove();
        d3.select('#js-months').selectAll('*').remove();
        d3.select('#js-legend').selectAll('*').remove();
        // Set Tippy.js styles
        this.injectTooltipStyles();
        // Heapmap
        const bathtilesHeatmap = document.createElement('div');
        bathtilesHeatmap.id = 'js-heatmap';
        target.appendChild(bathtilesHeatmap);
        // Months Label
        const bathtilesMonths = document.createElement('div');
        bathtilesMonths.id = 'js-months';
        target.appendChild(bathtilesMonths);
        // Legend
        const bathtilesLegend = document.createElement('div');
        bathtilesLegend.id = 'js-legend';
        target.appendChild(bathtilesLegend);
        // Setup Range
        var yearFormat = d3.utcFormat('%Y');
        var startYear = yearFormat(this.data.startDate);
        var endYear = Number(yearFormat(new Date())) + 1;
        // Get Colors based on value
        var formatColor = d3.scaleQuantize()
            .domain([1, this.data.maxCount])
            .range(this.colors.slice(1, NUMBER_OF_COLORS));

        // Construct heatmap
        var heatmapSvg = d3.select('#js-heatmap')
            .selectAll('svg')
            .data(d3.range(startYear, endYear))
            .enter()
            .append('svg')
            .attr('width', WIDTH)
            .attr('height', HEIGHT)
            .style('background-color', 'transparent');

        var rect = heatmapSvg.append('g')
            .attr('transform', `translate(${dx},0)`);

        // Create a Day square
        rect.selectAll('rect')
            .data((d) => d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)))
            .enter()
            .append('rect')
            .attr('width', CELL_SIZE)
            .attr('height', CELL_SIZE)
            .attr('x', (d) => d3.utcFormat('%U')(d) * CELL_SIZE)
            .attr('y', (d) => d.getDay() * CELL_SIZE)
            .style('stroke', '#fff')
            .style('stroke-width', 3)
            .style('fill', (d) => {
                const formattedDate = d3.utcFormat('%Y-%m-%d')(d); // Format the date correctly
                const countData = this.data.dates[formattedDate]; // Use the formatted date to get count
                console.log(`Date: ${formattedDate}, Count: ${countData}`); // Debugging line
                return countData && countData > 0 ? formatColor(countData) : '#eee';
            })
            .attr('data-tippy-content', (d) => {
                const formattedDate = d3.utcFormat('%Y-%m-%d')(d); // Format date for tooltip
                const countData = this.data.dates[formattedDate];
                const date = d3.utcFormat('%b %d, %Y')(new Date(d));
                return !countData ? `No posts on ${date}` : `${countData} post${countData > 1 ? 's' : ''} on ${date}`;
            })
            .call((s) => tippy(s.nodes(), { offset: [0, 0] }));

        // Construct Months label
        d3.select('#js-months').selectAll('svg.months')
            .data([1])
            .enter()
            .append('svg')
            .attr('width', LEGEND_WIDTH)
            .attr('height', 17)
            .attr('dominant-baseline', 'middle')
            .append('g')
            .attr('transform', 'translate(0,10)')
            .selectAll('text')
            .data(() => d3.range(12))
            .enter()
            .append('text')
            .attr('x', (d) => d * (4.5 * CELL_SIZE) + dx)
            .text((d) => d3.utcFormat('%b')(new Date(0, d + 1, 0)))

        const labelsGroup = heatmapSvg.append('g')
            .attr('transform', `translate(${dx - 40}, 0)`); // Adjust x position to the left

        // Add day labels
        labelsGroup.selectAll('text.days')
            .data(daysOfWeek)
            .enter()
            .append('text')
            .attr('x', 35) // Position the labels to the left of the heatmap
            .attr('y', (d, i) => i * CELL_SIZE + (CELL_SIZE / 2) + 5) // Position vertically based on index
            .style('text-anchor', 'end') // Align text to the end
            .text((d) => d); // Display the day name

        // Construct Legend
        var legendSvg = d3.select('#js-legend').selectAll('svg.legend')
            .enter()
            .append('svg')
            .data([1])
            .enter()
            .append('svg')
            .attr('width', LEGEND_WIDTH)
            .attr('height', LEGEND_HEIGHT)
            .append('g')
            .attr('transform', 'translate(672,0)')
            .selectAll('.legend-grid')
            .data(() => d3.range(NUMBER_OF_COLORS))
            .enter()
            .append('rect')
            .attr('width', CELL_SIZE)
            .attr('height', CELL_SIZE)
            .attr('x', (d) => d * CELL_SIZE + dx)
            .style('stroke', '#fff')
            .style('stroke-width', 3)
            .style('fill', (d) => this.colors[d]);

        console.log('Bathtiles.js - Finished!')
    }

    import(json = null) {
        if (json) {
            this.data = formatData(json); // Assuming formatData processes the JSON and returns the formatted data
            console.log('Data updated:', this.data);
        } else {
            console.log('No data to import.');
        }
    }

    empty() {
        this.data = formatData(null);
        console.log('Clearing data.');
    }
};

// Formats the JSON data to be easily ready by d3.
function formatData(data) {
    console.log('Bathtiles.js - Formatting Data...', data);
    if (!data) {
        const defaultStartDate = new Date();
        return {
            startDate: defaultStartDate,
            dates: {},
            maxCount: 0
        };
    }
    const parsedData = JSON.parse(data);
    const dateTable = {};
    let oldestDate = new Date();
    let maxCount = 0;
    const formatDate = d3.utcFormat('%Y-%m-%d');

    for (const [timestamp, count] of Object.entries(parsedData)) {
        const date = new Date(timestamp * 1000);
        const formattedDate = formatDate(date);
        dateTable[formattedDate] = count;

        if (timestamp < oldestDate) {
            oldestDate = formattedDate;
        }
        maxCount = Math.max(maxCount, dateTable[formattedDate]);
    }

    return {
        startDate: new Date(oldestDate),
        dates: dateTable,
        maxCount
    };
}

export { Bathtiles };
