function regex_lexfilter(re) {
	// data_full is the name of the full dataset
	var data = [];
	for (var i = 0; i < data_full.length; i++) {
		if (re.exec(data_full[i].word)) {
			data.push(data_full[i])
		}
	}
	return data;
}

data = regex_lexfilter(/^th(e$|anksg)/);

function mod_year(y, m) { return (parseInt(y) + m).toString();	}

var cur_year = '1950';
var scale_type = 'rank';
var min_year = 1800;
var max_year = 2000;

var width = 700;
var height = 600;

var tl_height = 100;
var words_stats_w = 100;

var x_offset = 75;
var y_offset = 75;

var c = d3.select("#c");
var tl = d3.select("#tl");

var c_svg = c.append('svg')
    .attr("width", width)
    .attr("height", height);

var ws_svg = c.append('svg')
	.attr("width", words_stats_w)
	.attr("height", height);

var tl_svg = tl.append('svg')
	.attr("width", width)
	.attr("height", tl_height);

function find_max_of_data(d, t) {
	var l = [];
	var dec_keys = Object.keys(d.decs)
	for (var i = 0; i < dec_keys.length; i++) {
		l.push(d.decs[dec_keys[i]][t][scale_type]);
	}
	return Math.max(...l);	
}

var x_scale = d3.scaleLinear()
	.domain([0, d3.max(data, function(d) { return find_max_of_data(d, 'u') })])
	.range([x_offset, width - x_offset ]);

var y_scale = d3.scaleLinear()
	.domain([0, d3.max(data, function(d) { return find_max_of_data(d, 't') })])
	.range([height - y_offset, y_offset]);

var tl_scale = d3.scaleLinear()
	.domain([min_year, max_year])
	.range([x_offset, width - x_offset]);

var wordsize_scale = d3.scaleSqrt()
	.domain([1, d3.max(data, function(d) { return d.word.length })])
	.range([3,7]);

// set up the axes
c_svg.append("g")
	.call(d3.axisBottom(x_scale))
	.attr("transform", "translate(0," + (height - y_offset) + ")")
	.attr("class", "x-axis");

c_svg.append("g")
	.call(d3.axisLeft(y_scale))
	.attr("transform", "translate(" + x_offset + ",0)")
	.attr("class", "y-axis");

tl_svg.append("g")
	.call(d3.axisBottom(tl_scale))
	.attr("transform", "translate(0," + (tl_height/2) + ")");

// set up the little info tool tip
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

// set up the gradients (for historic paths)
var linearGradient = c_svg.append("defs")
	.append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("x1", "0%")
   	.attr("y1", "0%")
   	.attr("x2", "100%")
   	.attr("y2", "0%");

linearGradient.append("stop")
	.attr("offset", "0%")
	.attr("stop-color", "white");

linearGradient.append("stop")
	.attr("offset", "30%")
	.attr("stop-color", "gray");

linearGradient.append("stop")
	.attr("offset", "100%")
	.attr("stop-color", "black");

var brushed_linearGradient = c_svg.select("defs")
	.append("linearGradient")
    .attr("id", "brushed-linear-gradient")
    .attr("x1", "0%")
   	.attr("y1", "0%")
   	.attr("x2", "100%")
   	.attr("y2", "0%");

brushed_linearGradient.append("stop")
	.attr("offset", "0%")
	.attr("stop-color", "white");

brushed_linearGradient.append("stop")
	.attr("offset", "30%")
	.attr("stop-color", "gray");

brushed_linearGradient.append("stop")
	.attr("offset", "100%")
	.attr("stop-color", "red");

/////////

function point_in_brush(px, py, brush_corners) {
	var x_lower = brush_corners[0][0], x_upper = brush_corners[1][0];
	var y_lower = brush_corners[0][1], y_upper = brush_corners[1][1];
	return ((px >= x_lower && px <= x_upper) &&
			(py >= y_lower && py <= y_upper));
}

var brush_corners;

var point_brush = d3.brush()
	.on('start', function(d) { 

		var wgs = c_svg.selectAll('.word-group');

		wgs.selectAll('circle')
			.attr('fill-opacity', 1)
			.attr('fill', 'black');

		wgs.selectAll('path')
			.attr("stroke", "url(#linear-gradient)");
	})
	.on('brush', function(d) {
		// gives back the top left corner and bottom right
		brush_corners = d3.event.selection;
		
		// make non-brushed points grayed out
		c_svg.selectAll('circle')
			.attr('fill-opacity', .3);

		var brushed_words = [];
		// select the right word-group objects
		var bgs = c_svg.selectAll('.word-group')
			.filter(function(e) { 
				var u_rank = x_scale(e.decs[cur_year]['u'][scale_type]), t_rank = y_scale(e.decs[cur_year]['t'][scale_type]);
				var should_highlight = point_in_brush(u_rank, t_rank, brush_corners);
				if (should_highlight) { brushed_words.push(e.word); } 
				return should_highlight;
			})

		bgs.selectAll('circle')
			.attr('fill-opacity', 1)
			.attr('fill', 'red');

		bgs.selectAll('path')
			.attr('stroke', 'url(#brushed-linear-gradient');
		
		console.log(brushed_words);

	})
  
c_svg.append('g')
	.attr('class', 'brush')
	.call(point_brush);

var tl_brush_ext = [cur_year, parseInt(cur_year) + 10];

function move_tl_brush(d, new_year) {
	if (new_year === undefined) {
		var tb_loc = d3.event.selection;
		tl_brush_ext = tb_loc.map(tl_scale.invert);
		new_year = (tl_brush_ext[0] + tl_brush_ext[1])/2;
		new_year = Math.round(new_year/10) * 10;
	}
	if (new_year >= min_year & new_year <= max_year) {
		var time_passed = cur_year - new_year;
		cur_year = new_year.toString();
			
		c_svg.selectAll("circle")
			.transition()
			.duration(500)
			.attr('cx', function(d) { return x_scale(d.decs[cur_year]['u'][scale_type]) })
			.attr('cy', function(d) { return y_scale(d.decs[cur_year]['t'][scale_type]) });

		////////////////////////////////////////
		c_svg.selectAll(".word-group")
			.selectAll("path")
			.attr("d", function(d) {
				var x_hist_scale = x_scale;
				var y_hist_scale = y_scale;
				p = 'M' + x_hist_scale(d.decs[cur_year]['u'][scale_type]) + ' ' + y_hist_scale(d.decs[cur_year]['t'][scale_type]); 
				for (var i = 1; i <= 10; i ++) {
					var new_hist_year = mod_year(cur_year, -10 * i)
					if (new_hist_year >= min_year) {
						p += ' L' + x_hist_scale(d.decs[new_hist_year]['u'][scale_type]) + ' ' + y_hist_scale(d.decs[new_hist_year]['t'][scale_type]);
					}
				}
				return p;
			})
			.attr("stroke-opacity", 0)
			.attr("stroke", "url(#linear-gradient)")
			.transition()
			.delay(500)
			.duration(500)
			.attr("stroke-opacity", 1)
			//.filter(function(d) {
			//	var u_rank = x_scale(d.decs[cur_year]['u'][scale_type]), t_rank = y_scale(d.decs[cur_year]['t'][scale_type]);
			//	return point_in_brush(u_rank, t_rank, brush_corners);
			//})
			//.attr("stroke", "url(#brushed-linear-gradient)");
		////////////////////////////////////////
	}
}

var tl_brush = d3.brushX()
	//.extent([[x_scale(1700),0], [x_scale(2100),tl_height]])
	.filter(function () {return d3.mouse(this)[0] > tl_scale(tl_brush_ext[0]) && d3.mouse(this)[0] < tl_scale(tl_brush_ext[1])})
	.on('brush end', function(d) { move_tl_brush(d) } );

var tl_bg = tl_svg.append('g')
	.call(tl_brush)
	.attr('class', 'tl-brush')
	.call(tl_brush.move, [cur_year-5, parseInt(cur_year) + 5].map(tl_scale));

tl_svg.selectAll('.tl-brush>.handle').remove();


function move_tl_slider(new_year, dur) {
	if (dur === undefined) {
		dur = 500;
	}
	tl_bg.transition()
		.duration(dur)
		.call(tl_brush.move, [new_year, new_year].map(tl_scale));
}

function whole_tl() {
	move_tl_slider(1990, 3000);
	//
}

function draw_points() {
	///////////////////////////////////////////////////////////////
	c_svg.selectAll('.word-group')
		.remove();

	c_svg.selectAll("circle")
		.data(data)
		.enter()
		.append("g")
		.attr('class', 'word-group')
		.append("circle")
		.attr('class', 'point-mouseoff')
		.attr('r', function(d) { return wordsize_scale(d.word.length) })
		.attr('cx', function(d) { return x_scale(d.decs[cur_year]['u'][scale_type]) })
		.attr('cy', function(d) { return y_scale(d.decs[cur_year]['t'][scale_type]) })
		.attr('fill', 'black')
		.on('mouseover click', function(d) {
			d3.select(this)
				.attr('class', 'point-mouseon')
				.attr('r', function(d) { return wordsize_scale(d.word.length) + 2});
				
			ws_svg.selectAll('.word-stats-word')
				.transition()
				.duration(500)
				.text(d.word);
	
			ws_svg.selectAll('.word-stats-rank')
				.transition()
				.duration(500)
				.text(d.decs[cur_year]['u'][scale_type] + ', ' + d.decs[cur_year]['t'][scale_type]);
		})
		.on('mouseout', function(d) { 
			d3.select(this)
				.attr('r', function(d) { return wordsize_scale(d.word.length)})
				.attr('class', 'point-mouseoff');
	
			ws_svg.selectAll('.word-stats-word')
				.transition()
				.duration(500)
				.text('----');
	
			ws_svg.selectAll('.word-stats-rank')
				.transition()
				.duration(500)
				.text('--')
		});
		
	c_svg.selectAll(".word-group")
		.append("path")
		.attr("stroke", "url(#linear-gradient)")
		.attr("stroke-dasharray", "5,5")
		.attr("fill", "none");
	///////////////////////////////////////////////////////////////
}
draw_points()

function scale_by(s_type) {
	scale_type = s_type;

	x_scale.domain([0, d3.max(data, function(d) { return find_max_of_data(d, 'u') })]);
	y_scale.domain([0, d3.max(data, function(d) { return find_max_of_data(d, 't') })]);

	c_svg.selectAll(".x-axis")
		.transition()
		.duration(500)
		.call(d3.axisBottom(x_scale))
		.attr("transform", "translate(0," + (height - y_offset) + ")");
		
	c_svg.selectAll(".y-axis")
		.transition()
		.duration(500)
		.call(d3.axisLeft(y_scale))
		.attr("transform", "translate(" + x_offset + ",0)")

	c_svg.selectAll("circle")
		.transition()
		.duration(500)
		.attr('cx', function(d) { return x_scale(d.decs[cur_year]['u'][scale_type]) })
		.attr('cy', function(d) { return y_scale(d.decs[cur_year]['t'][scale_type]) });

	c_svg.selectAll('.word-group')
		.selectAll('path')
		.attr('d', '');
}