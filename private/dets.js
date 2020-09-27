
let dets = {};

function act_det(det_id, act_type, callback) {
    $.ajax({
        type: "POST",
        url: "/" + act_type,
        data: { detID: det_id },

        success: function (data) {
            console.log(act_type + ' det OK: ' + data);
            callback(null, data);
        },
        error: function (err) {
            console.error(act_type + ' det failed: ' + err);
            callback(err, null);
        }
    });
}

function reject_det(det) {
    const tr = det.closest('tr');
    const row = $("#dets").DataTable().row(tr);
    const det_id = row.data().DetID; // or det.id

    act_det(det_id, 'reject_det', function (err, data) {
        if (!err) {
            //row.invalidate().draw(false);
            for (let i = 0; i < dets.length; i++) {
                const entry = dets[i];
                if (entry.DetID == det_id) {
                    entry.Accept_status = 'rejected';
                    break;
                }
            }
            $('#dets').DataTable().row(tr).invalidate().draw(false);
            //row.invalidate().draw(false);
        }
    });
}

function accept_det(det) {
    const tr = det.closest('tr');
    const row = $("#dets").DataTable().row(tr);
    const det_id = row.data().DetID; // or det.id

    act_det(det_id, 'accept_det', function (err, data) {
        if (!err) {
            //row.invalidate().draw(false);
            for (let i = 0; i < dets.length; i++) {
                const entry = dets[i];
                if (entry.DetID == det_id) {
                    entry.Accept_status = 'accepted';
                    break;
                }
            }
            //$('#dets').DataTable().row(tr).invalidate().draw(false);
            row.invalidate().draw(false);
        }
    });
}

function remove_det(det) {
    const tr = det.closest('tr');
    const row = $("#dets").DataTable().row(tr);
    const det_id = row.data().DetID; // or det.id

    act_det(det_id, 'remove_det', function (err, data) {
        if (!err) {
            for (let i = 0; i < dets.length; i++) {
                const entry = dets[i];
                if (entry.DetID == det_id) {
                    dets.splice(i, 1);
                    break;
                }
            }
            //row.invalidate().draw(false);
            $('#dets').DataTable().row(tr).remove().draw(false);
        }
    });
}

function reload_data(callback) {
    $.ajax({
        type: "POST",
        url: "/get_dets",
        data: {},
        success: function (data) {
            console.log(data);
            dets = data.Items;
            callback(null, data);
        },
        error: function (err) {
            console.error(err);
            callback(err, null);
        }
    });
}

function eval_accept_status(type, quants) {
    console.log(type)
    console.log(quants)
    
    acceot_status = (type == "FULL") ? "auto_accepted" : "await"

    if (type == "FULL")
        return "!!!"
        
    const quants_arr = quants.split("#")

    const quants_arr_length = quants_arr.length

    /*
    12_181_0_0,20000,85#
    12_181_0_1,20000,85#
    12_181_0_4,20500,83#
    12_181_0_5,20500,86#
    */
    
    var nums = []
    var curr_q_num = 0
    var misorder = 0
    for (i = 0; i < quants_arr_length; i++) {
        const quant_arr = quants_arr[i].split(",")
        const quant = quant_arr[0]
        const ts = quant_arr[1]
        const match = quant_arr[2]
        const quant_prop_arr = quant.split("_")
        const quant_prop_total_cnt = quant_prop_arr[0]
        const quant_prop_period_sec = quant_prop_arr[1]
        const quant_prop_q_num = quant_prop_arr[2]
        const quant_prop_q_subnum = quant_prop_arr[3]

        if (curr_q_num > quant_prop_q_num)
            misorder++
        else
            curr_q_num = quant_prop_q_num

        if (nums[quant_prop_q_num] == undefined)
            nums[quant_prop_q_num] = { "counter" : 1, "min_ts" : 0, "max_ts" : 0 }
        else {
            nums[quant_prop_q_num].counter++

            if (ts < nums[quant_prop_q_num].min_ts || nums[quant_prop_q_num].min_ts == 0)
                nums[quant_prop_q_num].min_ts = ts
            
            if (ts > nums[quant_prop_q_num].max_ts || nums[quant_prop_q_num].max_ts == 0)
                nums[quant_prop_q_num].max_ts = ts
        }
    }

    var cnt = Object.keys(nums).length
    var str = "!!!"
    str += Object.keys(nums).length
    str += "#"
    str += misorder
    str += "#"

    for (var ii in nums) {
        str += nums[ii].max_ts - nums[ii].min_ts
        str += "?"
        str += nums[ii].counter
        str += "#"
        if (misorder > 0)
            str += "misorder#"

        if (cnt <= 2 && (nums[ii].max_ts - nums[ii].min_ts > 2000)) 
            str += "timesusp#"

    }

    console.log(nums.length)
    console.log(nums)

    return str
}

$(document).ready(function () {
    $("#dets_box").append('<div id="dets_box_ovl" class="overlay"> <i class="fa fa-refresh fa-spin"></i> </div>');

    reload_data(function (err) {

        $('#dets')
            .on("page.dt", function () {
                console.log("page change" + $("#dets").DataTable().page.info().page);
            })
            .on("draw.dt", function () {
                //render_curr_page_row_children();
            })
            .DataTable({
                //data: dets,
                ajax: function (data, callback, settings) {
                    callback({ data: dets }) //reloads data 
                },
                //"bProcessing": false,
                //"bServerSide": true,
                deferRender: true,
                stateSave: true,
                paging: true,
                pageLength: 50,
                searching: true,
                order: [[4, 'desc']],
                createdRow: function (row, data, index) {
                    if (data.Accept_status == 'await') {
                        $(row).addClass('red');
                    }
                    
                    if (data.Accept_status == 'rejected') {
                        $(row).addClass('varod');
                    }
                },
                columns: [
                    {
                        "orderable": false,
                        width: 50,
                        "data": null,
                        'render': function (data, type, full, meta) {
                            return type === 'display' ?
                                "<a type='button' class='btn btn-default btn-xs' target='_blank' href='" + data.Analized_chunk_loc + "' role='button'>" +
                                "<i class='fa fa-play'/> feed" +
                                "</a>" :
                                data.Analized_chunk_loc;
                        }
                    },
                    {
                        //"orderable": false,
                        //width: 150,
                        "data": null,
                        "render": function (data, type, full, meta) {
                            //return data.Analized_chunk_loc;
                            return data.DetID;
                        }
                    },
                    { 'data': 'Feed_title' },
                    { 'data': 'Track_title'},
                    {
                        'data': 'Analized_chunk_TS',
                        'render': function (data, type, full, meta) {
                            return new Date(data).toISOString();
                        }
                    },
                    { 'data': 'Begin_shift' },
                    { 'data': 'End_shift' },
                    { 'data': 'Type' },
                    /*
                    {
                        'data': null,
                        "render": function (data, type, full, meta) {
                            return data != 'none' ? eval_accept_status(data.Type, data.Quants):"N/A"//data : '';
                        }
                    },
                    */
                   {
                        'data': null,
                        "render": function (data, type, full, meta) {
                            return 'N/A';
                        }
                    },
                    //{ 'data': 'Quants' },      
                    { 'data': 'Accept_status' },
                    {
                        "orderable": false,
                        width: 50,
                        'data': null,
                        "render": function (data, type, full, meta) {
                            return type === 'display' ?
                                '<div class="btn-group-vertical">' +
                                '<button type="button" id="' + data.DetID + '" onClick="accept_det(this)" class="btn btn-default btn-xs ' +
                                ((data.Accept_status == 'accepted' || data.Accept_status == 'auto_accepted') ? 'hidden' : '') +
                                '"><i class="fa fa-remove"></i>accept</button>' +
                                '</div>' :
                                '';
                        }
                    },
                    {
                        "orderable": false,
                        width: 50,
                        'data': null,
                        "render": function (data, type, full, meta) {
                            return type === 'display' ?
                                '<div class="btn-group-vertical">' +
                                '<button type="button" id="' + data.DetID + '" onClick="reject_det(this)" class="btn btn-default btn-xs ' +
                                ((data.Accept_status == 'rejected') ? 'hidden' : '') +
                                '"><i class="fa fa-remove"></i>reject</button>' +
                                '</div>' :
                                '';
                        }
                    },
                    {
                        "orderable": false,
                        width: 50,
                        'data': null,
                        "render": function (data, type, full, meta) {
                            return type === 'display' ?
                                '<div class="btn-group-vertical">' +
                                '<button type="button" id="' + data.DetID + '" onClick="remove_det(this)" class="btn btn-default btn-xs ' +
                                ((data.Accept_status != 'rejected') ? 'hidden' : '') +
                                '"><i class="fa fa-remove"></i>remove</button>' +
                                '</div>' :
                                '';
                        }
                    }
                ]
            });

        $("#dets_box_ovl").remove();
    });
});
