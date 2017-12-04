
var re = /^th/
var data1 = [];
for (var i = 0; i < data.length; i++) {
	if (re.exec(data[i].word)) {
		data1.push(data[i])
	}
}

data = data1;
data1 = [];
console.log(data.length)

//var width = window.innerWidth;
//var height = window.innerHeight;



var cur_year = '1990'

var width = 700;
var height = 600;
var tl_height = 100;

var words_stats_w = 100;

var x_offset = 75;
var y_offset = 75;

var c = d3.select("#c");

var c_svg = c.append('svg')
    .attr("width", width)
    .attr("height", height);

var ws_svg = c.append('svg')
	.attr("width", words_stats_w)
	.attr("height", height);

var tl_svg = c.append('svg')
	.attr("width", width)
	.attr("height", tl_height);

var x_scale = d3.scaleLinear()
	.domain(d3.extent(data, function(d) { 
		return d.decs[cur_year].u.rank;
	}))
	.range([x_offset, width - x_offset ]);

var y_scale = d3.scaleLinear()
	.domain(d3.extent(data, function(d) { 
		return d.decs[cur_year].t.rank;
	}))
	.range([height - y_offset, y_offset]);

var tl_scale = d3.scaleLinear()
	.domain([1800, 2000])
	.range([x_offset, width - x_offset]);

c_svg.append("g")
	.call(d3.axisBottom(x_scale))
	.attr("transform", "translate(0," + (height - y_offset) + ")");

c_svg.append("g")
	.call(d3.axisLeft(y_scale))
	.attr("transform", "translate(" + x_offset + ",0)");

tl_svg.append("g")
	.call(d3.axisBottom(tl_scale))
	.attr("transform", "translate(0," + (tl_height/2) + ")");

ws_svg.append("g")
	.append("text")
	.attr('text-anchor', 'middle')
	.attr('x', (words_stats_w/2))
	.attr('y', y_offset)
	.attr('class', 'word-stats-word')
	.text("----");

ws_svg.append("g")
	.append("text")
	.attr('text-anchor', 'middle')
	.attr('x', (words_stats_w/2))
	.attr('y', 1.25 * y_offset)
	.attr('class', 'word-stats-rank')
	.text("--");


var point_brush = d3.brush()
	.on('start', function(d) { 
		c_svg.selectAll('circle')
			//.attr('class', 'point-unbrushed')
			.attr('fill-opacity', 1) 
	})
	.on('brush', function(d) {
		// gives back the top left corner and bottom right
		var brush_corners = d3.event.selection;
		var x_lower = brush_corners[0][0], x_upper = brush_corners[1][0];
		var y_lower = brush_corners[0][1], y_upper = brush_corners[1][1];

		// make non-brushed points grayed out
		c_svg.selectAll('circle')
			.attr('fill-opacity', .3);
		var brushed_words = [];
		c_svg.selectAll('circle')
			.filter(function(e) {
				var u_rank = x_scale(e.decs[cur_year].u.rank), 
					t_rank = y_scale(e.decs[cur_year].t.rank);
				
				var should_highlight = ((u_rank >= x_lower && u_rank <= x_upper) &&
									(t_rank >= y_lower && t_rank <= y_upper));
				if (should_highlight) { brushed_words.push(e.word); } 
				return should_highlight;
				}) 
			.attr('fill-opacity', 1);
			//.attr('class', 'point-unbrushed')
		console.log(brushed_words);
		
	})
  
c_svg.append('g')
	.attr('class', 'brush')
	.call(point_brush);


var tl_brush_ext = [cur_year, parseInt(cur_year) + 10]
var tl_brush = d3.brushX()
	//.extent([[1800,0], [tl_scale(2000),tl_height]])
	.filter(function () {return d3.mouse(this)[0] > tl_scale(tl_brush_ext[0]) && d3.mouse(this)[0] < tl_scale(tl_brush_ext[1])})
	//.on('start', function(d) {
	//	var brush_loc = tl_scale.invert(d3.event.selection[0]);
		//tl_brush.call(tl_brush.move, [brush_loc-5, brush_loc+5].map(tl_scale))
	//	console.log(brush_loc)

	//})
	.on('brush end', function(d) {
		var tb_loc = d3.event.selection;
		tl_brush_ext = tb_loc.map(tl_scale.invert);
		var new_year = (tl_brush_ext[0] + tl_brush_ext[1])/2;
		new_year = Math.round(new_year/10) * 10;
		if (new_year >= 1800 & new_year <= 2000) {
			cur_year = new_year;
			x_scale.domain(d3.extent(data, function(d) { 
				return d.decs[cur_year].u.rank;
			}))
			.domain(d3.extent(data, function(d) { 
				return d.decs[cur_year].t.rank;
			}))

			c_svg.selectAll("circle")
				.transition()
				.duration(500)
				.attr('cx', function(d) { return x_scale(d.decs[cur_year].u.rank) })
				.attr('cy', function(d) { return y_scale(d.decs[cur_year].t.rank) });
		}
	})

var tl_bg = tl_svg.append('g')
	.call(tl_brush)
	.attr('class', 'tl-brush')
	.call(tl_brush.move, [cur_year, parseInt(cur_year) + 10].map(tl_scale));

tl_svg.selectAll('.tl-brush>.handle').remove();

//tl_svg.selectAll('rect')
//	.attr('fill', 'white')
//	.attr('stroke', 'black')

///////////////////////////////////////////////////////////////
c_svg.selectAll("circle")
	.data(data)
	.enter()
	.append("circle")
	.attr('class', 'point-mouseoff')
	.attr('cx', function(d) { return x_scale(d.decs[cur_year].u.rank) })
	.attr('cy', function(d) { return y_scale(d.decs[cur_year].t.rank) })
	.attr('fill', 'black')
	.on('mouseover click', function(d) {
		d3.select(this)
			.attr('class', 'point-mouseon');
			//.attr('fill','red');

		ws_svg.selectAll('.word-stats-word')
			.transition()
			.duration(500)
			.text(d.word);

		ws_svg.selectAll('.word-stats-rank')
			.transition()
			.duration(500)
			.text(d.decs[cur_year].u.rank + ', ' + d.decs[cur_year].t.rank);
	})
	.on('mouseout', function(d) { 
		d3.select(this)
			.attr('class', 'point-mouseoff');
			//.attr('fill', 'black');

		ws_svg.selectAll('.word-stats-word')
			.transition()
			.duration(500)
			.text('----');

		ws_svg.selectAll('.word-stats-rank')
			.transition()
			.duration(500)
			.text('--')
	});

	
