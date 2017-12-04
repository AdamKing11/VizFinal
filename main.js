
var re = /^th(e$|ank)/
var data1 = [];
for (var i = 0; i < data.length; i++) {
	if (re.exec(data[i].word)) {
		data1.push(data[i])
	}
}

data = data1;
data1 = [];
console.log(data.length)

function mod_year(y, m) { return (parseInt(y) + m).toString();	}

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
		console.log(brushed_words);
		
	})
  
c_svg.append('g')
	.attr('class', 'brush')
	.call(point_brush);


var tl_brush_ext = [cur_year, parseInt(cur_year) + 10]
var tl_brush = d3.brushX()
	.filter(function () {return d3.mouse(this)[0] > tl_scale(tl_brush_ext[0]) && d3.mouse(this)[0] < tl_scale(tl_brush_ext[1])})
	.on('brush end', function(d) {
		var tb_loc = d3.event.selection;
		tl_brush_ext = tb_loc.map(tl_scale.invert);
		var new_year = (tl_brush_ext[0] + tl_brush_ext[1])/2;
		new_year = Math.round(new_year/10) * 10;
		if (new_year >= 1800 & new_year <= 2000) {
			var time_passed = cur_year - new_year;
			cur_year = new_year;
			
			x_scale.domain(d3.extent(data, function(d) { 
				return d.decs[cur_year].u.rank;
			}))
			y_scale.domain(d3.extent(data, function(d) { 
				return d.decs[cur_year].t.rank;
			}))

			c_svg.selectAll("circle")
				.transition()
				.duration(500)
				.attr('cx', function(d) { return x_scale(d.decs[cur_year].u.rank) })
				.attr('cy', function(d) { return y_scale(d.decs[cur_year].t.rank) });

			//c_svg.selectAll(".point-hist-line")
			//	.remove();
			
			var hist_data = [];
			for (var i = 0; i < 1; i++) {
				var x_hist_scale = x_scale;
				var y_hist_scale = y_scale;
				for (var j = 0; j < data.length; j++) {
					var new_datum = {};
					var year1 = mod_year(cur_year, -10 * (i+1));
					var year2 = mod_year(cur_year, -10 * i);

					new_datum['x1'] = x_hist_scale(data[j].decs[year1].u.rank);
					new_datum['y1'] = y_hist_scale(data[j].decs[year1].t.rank);
					
					x_hist_scale.domain(d3.extent(data, function(d) { 
						return d.decs[year1].u.rank;
					}));
					y_hist_scale.domain(d3.extent(data, function(d) { 
						return d.decs[year1].t.rank;
					}))
					
					console.log(year1, year2)
					new_datum['x2'] = x_hist_scale(data[j].decs[year2].u.rank);
					new_datum['y2'] = y_hist_scale(data[j].decs[year2].t.rank);
					new_datum['opacity'] = 1 - (i)/3;
					hist_data.push(new_datum);
				}
			};
			
			c.selectAll("svg").selectAll("line")
				//.exit()
				.data(hist_data)
				.enter()
				.append("line")
			//	.attr("class", "point-hist-line")
				.attr('x1', function(d) { return d.x1; } )
				.attr('x2', function(d) { return d.x2; })
				.attr('y1', function(d) { return d.y1; })
				.attr('y2', function(d) { return d.y2; })
		//		.attr('stroke-opacity', .5);				
			
			
			//for (var i = 0; i < 3; i++) {
			//	console.log(i)
			//	c_svg.selectAll("line")
			//		.data(hist_data)
			//		.enter()
			//		.append("line")
					//.attr("class", "point-hist-line")
			//		.attr("x1", function(d) { return d.x1 })
			//		.attr("y1", function(d) { return d.y1 })
			//		.attr("x2", function(d) { return d.x2 })
			//		.attr("y2", function(d) { return d.y2 })
			//		.attr("stroke", "red");
					//.attr('fill', 'red')
					//.attr('x2', function(d) { return x_scale(d.decs[mod_year(cur_year, -10 * i)].u.rank) })
					//.attr('y2', function(d) { return y_scale(d.decs[mod_year(cur_year, -10 * i)].t.rank) })
					//.attr('stroke-opacity', 0);
			//}
			
			//c_svg.selectAll(".point-hist-line")
			//	.transition()
			//	.duration(500)
			//	.delay(500)
			//	.attr('stroke-opacity', .8)		
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
console.log(cur_year);
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

	
