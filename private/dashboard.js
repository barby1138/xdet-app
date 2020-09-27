
let dets = {};
let tracks = {};
let feeds = {};

function reload_data(callback) {
    $.ajax({
        type: "POST",
        url: "/get_feeds_tracks_dets",
        data: {},
        success: function (data) {
            console.log(data);
            tracks = data.Tracks.Items;
            feeds = data.Feeds.Items;

            dets = data.Dets.Items;

            Task_processed_counts = data.Task_processed_counts;
            
            tasks_idle = data.Tasks_idle.Items
            tasks_dl_queued = data.Tasks_dl_queued.Items
            tasks_dl = data.Tasks_downloaded.Items
            tasks_error = data.Tasks_error.Items

            //track_feed_map = data.Maps.Items;
            //console.log(task_counts)
            callback(null, data);
        },
        error: function (err) {
            console.error(err);
            callback(err, null);
        }
    });
}

window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'yellowgreen',//'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

const presets = window.chartColors;

$(document).ready(function () {
    reload_data(function (err) {

        document.getElementById('dl_idle_count').innerText = tasks_idle.length;
        document.getElementById('dl_queued_count').innerText = tasks_dl_queued.length;
        document.getElementById('dl_error_count').innerText = tasks_error.length;

        let now = new Date();
        let startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        //startOfDay = new Date(startOfDay -  4*30 * 864e5)
        const tomorrow = new Date(startOfDay + 1 * 864e5);
        now = tomorrow
        const yesterday = new Date(startOfDay - 1 * 864e5);
        const sevendaysbefore = new Date(startOfDay - 7 * 864e5);
        const thirtydaysbefore = new Date(startOfDay - 38 * 864e5);

        const tasks_dl_today_count = tasks_dl.filter(it => it.Dl_TS < tomorrow  && it.Dl_TS > startOfDay).length;
        const tasks_dl_yesterday_count = tasks_dl.filter(it => it.Dl_TS < startOfDay && it.Dl_TS > yesterday).length;
        const tasks_dl_sevendays_count = tasks_dl.filter(it => it.Dl_TS < startOfDay && it.Dl_TS > sevendaysbefore).length;
        const tasks_dl_thirtydays_count = tasks_dl.filter(it => it.Dl_TS < startOfDay && it.Dl_TS > thirtydaysbefore).length;
        console.log(tasks_dl.length)
        //console.log(tasks_dl_yesterday_count)
        document.getElementById('dl_today_yesterday_month_count').innerText = 
                                tasks_dl_today_count + " / " + tasks_dl_yesterday_count + " / " + tasks_dl_thirtydays_count
        //document.getElementById('dl_today_count').innerText = tasks_dl_today_count;
        //document.getElementById('dl_yesterday_count').innerText = tasks_dl_yesterday_count;
        //document.getElementById('dl_sevendays_count').innerText = tasks_dl_sevendays_count;
        //document.getElementById('dl_thirtydays_count').innerText = tasks_dl_thirtydays_count;

        /*
        const tasks_proc_today_count = tasks_proc.filter(it => it.Proc_TS > startOfDay).length;
        const tasks_proc_yesterday_count = tasks_proc.filter(it => it.Proc_TS < startOfDay && it.Proc_TS > yesterday).length;
        const tasks_proc_sevendays_count = tasks_proc.filter(it => it.Proc_TS > sevendaysbefore).length;
        const tasks_proc_thirtydays_count = tasks_proc.filter(it => it.Proc_TS > thirtydaysbefore).length;
        */
        const tasks_proc_today_count = Task_processed_counts.today
        const tasks_proc_yesterday_count = Task_processed_counts.yesterday
        const tasks_proc_sevendays_count = Task_processed_counts.week
        const tasks_proc_thirtydays_count = Task_processed_counts.month
        //console.log(tasks_dl.length)
        //console.log(tasks_proc_yesterday_count)
        document.getElementById('proc_today_count').innerText = tasks_proc_today_count;
        document.getElementById('proc_yesterday_count').innerText = tasks_proc_yesterday_count;
        document.getElementById('proc_sevendays_count').innerText = tasks_proc_sevendays_count;
        document.getElementById('proc_thirtydays_count').innerText = tasks_proc_thirtydays_count;

        //.filter((v, i, a) => a.indexOf(v) === i)
        const dets_today_count = dets.filter(it => it.Analized_chunk_TS < tomorrow && it.Analized_chunk_TS > startOfDay).length;
        const dets_yesterday_count = dets.filter(it => it.Analized_chunk_TS < startOfDay && it.Analized_chunk_TS > yesterday).length;
        const dets_sevendays_count = dets.filter(it => it.Analized_chunk_TS < startOfDay && it.Analized_chunk_TS > sevendaysbefore).length;
        const dets_thirtydays_count = dets.filter(it => it.Analized_chunk_TS < startOfDay && it.Analized_chunk_TS > thirtydaysbefore).length;

        var today = dets.filter(it => it.Analized_chunk_TS < tomorrow && it.Analized_chunk_TS > startOfDay)
        
        var not_flags = [] 
        //var flags = []
        var today_u = dets.filter(it => it.Analized_chunk_TS < tomorrow && it.Analized_chunk_TS > startOfDay).filter( function foo(it) {
                    if ( typeof foo.flags == 'undefined' ) {
                        // It has not... perform the initialization
                        foo.flags = [];
                    }
                    if(foo.flags[it.Analized_chunk_loc]) {
                        not_flags[it.Analized_chunk_loc] = true;
                        return false;
                    }
                    foo.flags[it.Analized_chunk_loc] = true;
                    return true;
                    })

        console.log("all")
        console.log(today.length)
        console.log("u")
        console.log(today_u.length)
        console.log("not u")
        console.log(not_flags)

        const unique_dets_today_count = dets.filter(it => it.Analized_chunk_TS < tomorrow && it.Analized_chunk_TS > startOfDay)
                                        .map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])
                                        .length;
        const unique_dets_yesterday_count = dets.filter(it => it.Analized_chunk_TS < startOfDay && it.Analized_chunk_TS > yesterday)
                                        .map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])
                                        .length;
        const unique_dets_sevendays_count = dets.filter(it => it.Analized_chunk_TS < startOfDay && it.Analized_chunk_TS > sevendaysbefore)
                                            .map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])
                                            .length;
        const unique_dets_thirtydays_count = dets.filter(it => it.Analized_chunk_TS < startOfDay && it.Analized_chunk_TS > thirtydaysbefore)
                                            .map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])        
                                            .length;

        console.log(dets.length)
        document.getElementById('dets_today_count').innerText = dets_today_count + " / " + unique_dets_today_count;
        document.getElementById('dets_yesterday_count').innerText = dets_yesterday_count + " / " + unique_dets_yesterday_count;
        document.getElementById('dets_sevendays_count').innerText = dets_sevendays_count + " / " + unique_dets_sevendays_count;
        document.getElementById('dets_thirtydays_count').innerText = dets_thirtydays_count + " / " + unique_dets_thirtydays_count;

        const tracks_total_count = tracks.length;
        const feeds_total_count = feeds.length;
        const feeds_running_count = feeds.filter(it => it.OperationalState == 'running').length;
        //document.getElementById('tracks_total_count').innerText = tracks_total_count;
        //document.getElementById('feeds_total_count').innerText = feeds_total_count;
        //document.getElementById('feeds_active_count').innerText = feeds_running_count;

        /*
        // month
        var y = now.getFullYear();
        var m = now.getMonth();
        // TODO if m== 1?
        var firstDay = new Date(y, m - 1, 1);
        var lastDay = new Date(y, m, 0);
        */
        // week
        const first = sevendaysbefore;
        const last = now;//startOfDay;

        let labels = [];
        for (let c = 0; c < 8; c++) {
            const d = new Date(now - (7 - c) * 864e5);
            const ts = d.toDateString();
            labels.push(ts);
        }

        let dets_total_period = { 'auto_accepted': 0, 'accepted': 0, 'await': 0, 'rejected': 0, 'total': 0 };
        let dets_count_map = { ts: {}, ft: {}, tt: {} };

        //dets.map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])

        //dets
        dets.map(it => it.Analized_chunk_loc).filter((v, i, a) => a.indexOf(v) === i).map((v, i, a) => dets[a.indexOf(v)])
        .filter(it => ((it.Analized_chunk_TS > first) && (it.Analized_chunk_TS < last))).map(it => {
            //labels - uniq date
            const d = new Date(it.Analized_chunk_TS);

            const ft = it.Feed_title;
            const tt = it.Track_title;
            const ts = d.toDateString();

            const status = it.Accept_status;
            if (dets_count_map.ts[ts] == undefined)
                dets_count_map.ts[ts] = { 'auto_accepted': 0, 'accepted': 0, 'await': 0, 'rejected': 0, 'total': 0 };
            dets_count_map.ts[ts][status]++;
            dets_count_map.ts[ts]['total']++;
            dets_total_period[status]++;
            dets_total_period['total']++;

            if (dets_count_map.ft[ft] == undefined)
                dets_count_map.ft[ft] = 0;
            dets_count_map.ft[ft]++;

            if (dets_count_map.tt[tt] == undefined)
                dets_count_map.tt[tt] = 0;
            dets_count_map.tt[tt]++;
        });

        //console.log(dets_count_map);

        const utils = {
            transparentize: function (color, opacity) {
                const alpha = opacity === undefined ? 0.5 : 1 - opacity;
                return Color(color).alpha(alpha).rgbString();
            }
        };

        const dets_total_period_total = dets_total_period['total'];

        function init_ctrl_progress(tops_arr, idx, id_prefix, color) {
            if (tops_arr[idx]) {
                document.getElementById(id_prefix + '_name').innerHTML = tops_arr[idx].name;
                document.getElementById(id_prefix + '_count').innerHTML = '<b>' + tops_arr[idx].count + '</b>/' + dets_total_period_total;
                document.getElementById(id_prefix + '_count_progress').style.width = (100 * tops_arr[idx].count / dets_total_period_total) + '%';
                document.getElementById(id_prefix + '_count_progress').style.backgroundColor = color;
            }
            else {
                // todo hide
            }
        }

        function make_states_arr() {
            const states = [
                { name: 'auto accepted', count: dets_total_period['auto_accepted'] },
                { name: 'accepted', count: dets_total_period['accepted'] },
                { name: 'await', count: dets_total_period['await'] },
                { name: 'rejected', count: dets_total_period['rejected'] }
            ];

            return states;
        }

        function make_tops_arr(set, tops_count) {
            let sortable = [];
            for (let it in set) {
                sortable.push([set[it], it]);
            }
            sortable.sort(function (a, b) {
                return b[0] - a[0];
            });

            let total_in_top_feeds = 0;
            let tops = [];
            for (let c = 0; c < tops_count; c++) {
                if (sortable[c] != undefined) {
                    tops.push({ name: sortable[c][1], count: sortable[c][0] });
                    total_in_top_feeds += sortable[c][0];
                }
                else
                    tops.push(null);
            }

            return {
                tops: tops,
                others: [{ name: 'Others', count: (dets_total_period_total - total_in_top_feeds) }]
            };
        }

        const states = make_states_arr();
        init_ctrl_progress(states, 0, 'dets_auto', utils.transparentize(presets.blue));
        init_ctrl_progress(states, 1, 'dets_accepted', utils.transparentize(presets.green));
        init_ctrl_progress(states, 2, 'dets_await', utils.transparentize(presets.yellow));
        init_ctrl_progress(states, 3, 'dets_rejected', utils.transparentize(presets.red));

        /*
        const top_feeds_arr = make_tops_arr(dets_count_map.ft, 5);
        const top_feeds = top_feeds_arr.tops;
        const top_feeds_others = top_feeds_arr.others;
        init_ctrl_progress(top_feeds, 0, 'dets_feeds0', utils.transparentize(presets.blue));
        init_ctrl_progress(top_feeds, 1, 'dets_feeds1', utils.transparentize(presets.green));
        init_ctrl_progress(top_feeds, 2, 'dets_feeds2', utils.transparentize(presets.orange));
        init_ctrl_progress(top_feeds, 3, 'dets_feeds3', utils.transparentize(presets.yellow));
        init_ctrl_progress(top_feeds, 4, 'dets_feeds4', utils.transparentize(presets.red));
        init_ctrl_progress(top_feeds_others, 0, 'dets_feedsothers', utils.transparentize(presets.grey));

        const top_tracks_arr = make_tops_arr(dets_count_map.tt, 5);
        const top_tracks = top_tracks_arr.tops;
        const top_tracks_others = top_tracks_arr.others;
        init_ctrl_progress(top_tracks, 0, 'dets_tracks0', utils.transparentize(presets.blue));
        init_ctrl_progress(top_tracks, 1, 'dets_tracks1', utils.transparentize(presets.green));
        init_ctrl_progress(top_tracks, 2, 'dets_tracks2', utils.transparentize(presets.orange));
        init_ctrl_progress(top_tracks, 3, 'dets_tracks3', utils.transparentize(presets.yellow));
        init_ctrl_progress(top_tracks, 4, 'dets_tracks4', utils.transparentize(presets.red));
        init_ctrl_progress(top_tracks_others, 0, 'dets_tracksothers', utils.transparentize(presets.grey));
        */
        const data = {
            labels: labels,//generateLabels(),
            datasets: [{
                backgroundColor: utils.transparentize(presets.blue),
                borderColor: presets.blue,
                data: labels.map(it => (dets_count_map.ts[it] == undefined) ? 0 : dets_count_map.ts[it]['auto_accepted']),
                label: 'auto accepted',
                fill: '1'
            },
            {
                backgroundColor: utils.transparentize(presets.green),
                borderColor: presets.green,
                data: labels.map(it => (dets_count_map.ts[it] == undefined) ? 0 : dets_count_map.ts[it]['accepted']),
                label: 'accepted',
                fill: '1'
            },
            {
                backgroundColor: utils.transparentize(presets.yellow),
                borderColor: presets.yellow,
                data: labels.map(it => (dets_count_map.ts[it] == undefined) ? 0 : dets_count_map.ts[it]['await']),
                label: 'await',
                fill: '1'
            },
            {
                backgroundColor: utils.transparentize(presets.red),
                borderColor: presets.red,
                data: labels.map(it => (dets_count_map.ts[it] == undefined) ? 0 : dets_count_map.ts[it]['rejected']),
                //hidden: true,
                label: 'rejected',
                fill: '1'
            }]
        };

        const options = {
            maintainAspectRatio: false,
            spanGaps: false,
            responsive: true,
            legend: {
                display: false,
                position: 'bottom',
            },
            title: {
                display: false,
                text: 'TOTAL'
            },
            elements: {
                line: {
                    tension: 0.000001
                }
            },
            scales: {
                yAxes: [{
                    //stacked: true
                }]
            }/*,
        plugins: {
            filler: {
                propagate: false
            },
            'samples-filler-analyser': {
                target: 'chart-analyser'
            }
        }*/
        };

        const ctx = document.getElementById("chart1").getContext("2d");
        ctx.canvas.width = 1000;
        ctx.canvas.height = 300;

        const chart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });

        window.onload = function () {
        };

        // -------------
        // - PIE CHART -
        // -------------
        var pie_options = {
            /*
            // Boolean - Whether we should show a stroke on each segment
            segmentShowStroke    : true,
            // String - The colour of each segment stroke
            segmentStrokeColor   : '#fff',
            // Number - The width of each segment stroke
            segmentStrokeWidth   : 1,
            */
            // Number - The percentage of the chart that we cut out of the middle
            percentageInnerCutout: 50, // This is 0 for Pie charts
            // Number - Amount of animation steps
            animationSteps       : 100,
            // String - Animation easing effect
            animationEasing      : 'easeOutBounce',
            // Boolean - Whether we animate the rotation of the Doughnut
            animateRotate        : true,
            // Boolean - Whether we animate scaling the Doughnut from the centre
            animateScale         : false,
            // Boolean - whether to make the chart responsive to window resizing
            responsive           : true,
            // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
            maintainAspectRatio  : false,
            // String - A legend template
            //legendTemplate       : '<ul class=\'<%=name.toLowerCase()%>-legend\'><% for (var i=0; i<segments.length; i++){%><li><span style=\'background-color:<%=segments[i].fillColor%>\'></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>',
            // String - A tooltip template
            //tooltipTemplate      : '<%=value %> <%=label%> users'
            legend: {
                display: true,
                position: 'bottom'
            }
        };



        var config = {
            type: 'pie',
            data: {
                datasets: [{
                    data: [
                        dets.filter(it => it.KWs != undefined && it.KWs.indexOf('pornstar:') != -1).length,
                        dets.filter(it => it.KWs != undefined && it.KWs.indexOf('category:') != -1).length,
                        dets.filter(it => it.KWs != undefined && it.KWs.indexOf('usr:') != -1).length,
                        dets.filter(it => it.KWs != undefined && it.KWs.indexOf('det_rltd') != -1).length,
                        dets.filter(it => it.KWs == undefined || 
                                    (it.KWs.indexOf('pornstar:') == -1 &&
                                    it.KWs.indexOf('category:') == -1 &&
                                    it.KWs.indexOf('usr:') == -1 &&
                                    it.KWs.indexOf('det_rltd') == -1)).length
                    ],
                    backgroundColor: [
                        presets.blue,
                        presets.green,
                        presets.yellow,
                        presets.red,
                        presets.purple
                    ],
                }],
                labels: [
                    "star",
                    "cat",
                    "usr",
                    "rltd",
                    "kw"
                ]
            },
            options: pie_options/*{
                responsive: true
            }*/
        };

        // Get context with jQuery - using jQuery's .get() method.
        var pieChartCanvas = $('#pieChart').get(0).getContext('2d');
        var pieChart       = new Chart(pieChartCanvas, config)

        var config_1 = {
            type: 'pie',
            data: {
                datasets: [{
                    data: [
                        dets.filter(it => it.Feed_title == "pornhub").length,
                        dets.filter(it => it.Feed_title == "xvideos").length,
                        dets.filter(it => it.Feed_title == "xhamster").length
                    ],
                    backgroundColor: [
                        presets.blue,
                        presets.green,
                        presets.yellow,
                    ],
                }],
                labels: [
                    "ph",
                    "xv",
                    "xh"
                ]
            },
            options: pie_options/*{
                responsive: true
            }*/
        };

        // Get context with jQuery - using jQuery's .get() method.
        var pieChartCanvas_1 = $('#pieChart_1').get(0).getContext('2d');
        var pieChart       = new Chart(pieChartCanvas_1, config_1)

        
        var config_2 = {
            type: 'pie',
            data: {
                datasets: [{
                    data: [
                        tasks_idle.filter(it => it.Tube == "pornhub").length,
                        tasks_idle.filter(it => it.Tube == "xvideos").length,
                        tasks_idle.filter(it => it.Tube == "xhamster").length
                    ],
                    backgroundColor: [
                        presets.blue,
                        presets.green,
                        presets.yellow,
                    ],
                }],
                labels: [
                    "ph",
                    "xv",
                    "xh"
                ]
            },
            options: pie_options/*{
                responsive: true
            }*/
        };

        // Get context with jQuery - using jQuery's .get() method.
        var pieChartCanvas_2 = $('#pieChart_2').get(0).getContext('2d');
        var pieChart       = new Chart(pieChartCanvas_2, config_2)
        // -----------------
        // - END PIE CHART -
        // -----------------
    });
});