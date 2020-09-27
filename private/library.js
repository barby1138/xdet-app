const UPLOAD_LIMIT = 100;

let tracks = {};
let feeds = {};
let track_feed_map = {};
/*
// util
function is_bound(feedID, trackID) {
    const track_feed_map_clone = track_feed_map;
    for (let i = 0; i < track_feed_map_clone.length; i++) {
        const entry = track_feed_map_clone[i];
        if (entry.TrackID == trackID && entry.FeedID == feedID) {
            console.log("is_bound YES");
            return true;
        }
    }

    console.log("is_bound NO");
    return false;
}
*/
// tracks
function bind_unbind_track_feed(feed) {
    const tr_reack1 = feed.closest('table').closest('tr');
    const tr_track2 = $(tr_reack1).prev();
    const row_track = $("#tracks").DataTable().row(tr_track2);
    //console.log('feedID' + row_track.data().TrackID);
    const track_id = row_track.data().TrackID;

    const tr = feed.closest('tr');
    const row = $("#track_feeds_" + track_id).DataTable().row(tr);
    //console.log(row.data().FeedID);
    const feed_id = row.data().FeedID;

    //console.log(track_id);
    //console.log(feed_id);

    if ($("#feed_plus_" + feed_id + track_id).hasClass("hidden")) {
        unbind_track_feed(track_id, feed_id, function (err, data) {
            if (!err) {
                for (let i = 0; i < track_feed_map.length; i++) {
                    const entry = track_feed_map[i];
                    if (entry.TrackID == track_id && entry.FeedID == feed_id) {
                        track_feed_map.splice(i, 1);
                        break;
                    }
                }
                row.invalidate().draw(false);
                row_track.invalidate().draw(false);
                $('#bind_' + track_id).removeClass("hidden");
            }
        });
    }
    else {
        bind_track_feed(track_id, feed_id, function (err, data) {
            if (!err) {
                track_feed_map.push({ 'UserID': 'local', 'TrackID': track_id, 'FeedID': feed_id });
                row.invalidate().draw(false);
                row_track.invalidate().draw(false);
                $('#bind_' + track_id).removeClass("hidden");
            }
        });
    }
}

function add_track() {
    if ($('#add_track').hasClass("hide_form")) {
        $('#add_track').removeClass("hide_form");
        $('#add_track').slideDown();
    }
    else {
        $('#add_track').addClass("hide_form");
        $('#add_track').slideUp();
    }
}

function cancel_add_track() {
    if ($('#add_track').hasClass("hide_form")) {
        console.log('should not happen');
    }
    else {
        $('#add_track').addClass("hide_form");
        $('#add_track').slideUp(function () {
            $('#add_track_form')[0].reset();
        });
    }
}

function cancel_edit_track(edit_track) {
    const id = edit_track.id;

    if ($('#edit_track_' + id).hasClass("hide_form")) {
        console.log('should not happen');
    }
    else {
        $('#edit_track_' + id).addClass("hide_form");
        $('#edit_track_' + id).slideUp(function () { });
    }
}

function remove_track(track) {
    const tr = track.closest('tr');
    const row = $('#tracks').DataTable().row(tr);
    const id = row.data().TrackID;

    $.ajax({
        type: "POST",
        url: "/remove_track",
        data: { trackID: id },
        success: function (data) {
            // TODO consider remove from map as well
            // remove track / remove row redraw
            let found = false;
            for (let i = 0; i < tracks.length; i++) {
                const entry = tracks[i];
                if (entry.TrackID == id) {
                    tracks.splice(i, 1);
                    found = true;
                    break;
                }
            }
            if (!found) console.error("WARNING desync of data/representation")
            $('#tracks').DataTable().row(tr).remove().draw(false);
        },
        error: function (err) {
            console.error(err);
        }
    });
}

function play_track(track) {
    alert(track.id);
}

function filter_all_bound_feeds(o) {
    if ($("#plus_" + o.value).hasClass("hidden")) {
        $("#plus_" + o.value).removeClass("hidden");
        $("#minus_" + o.value).addClass("hidden");
        $("#track_feeds_" + o.value).DataTable().search("yes").draw(false);
    }
    else {
        $("#minus_" + o.value).removeClass("hidden");
        $("#plus_" + o.value).addClass("hidden");
        $("#track_feeds_" + o.value).DataTable().search("no").draw(false);
    }
}

const EDIT_TRACK_OPENED_FG = 1;
const FEEDS_TBL_OPENED_FG = 2;

function show_edit_track(track) {
    const tr = track.closest('tr');
    const row = $('#tracks').DataTable().row(tr);
    const id = row.data().TrackID;

    if (!row.child.isShown()) {
        row.child(fnFormatDetails(id)).show();
    }

    const ckey = 'openRows_' + id;
    let val = parseInt(getCookie(ckey));
    if ($('#edit_track_' + id).hasClass("hide_form")) {
        val = (val != NaN) ? (val | EDIT_TRACK_OPENED_FG) : EDIT_TRACK_OPENED_FG;
    }
    else {
        val = (val != NaN) ? (val & ~EDIT_TRACK_OPENED_FG) : 0;
    }
    setCookie(ckey, val.toString(), 10000);

    show_edit_track_inner(row);
}

function show_edit_track_inner(row) {
    const id = row.data().TrackID;

    $("#edit_track_form_title_" + id).val(row.data().Title);
    $("#edit_track_form_tags_" + id).val(row.data().Tags);
    $("#edit_track_form_upload_track_" + id).filestyle({ buttonText: '', placeholder: row.data().OriginalName, buttonBefore: 'true', buttonName: 'btn-default btn-xs varod' });

    if ($('#edit_track_' + id).hasClass("hide_form")) {
        $('#edit_track_' + id).removeClass("hide_form");
        //console.log("edit remove hide");
        $('#edit_track_' + id).slideDown();
        //console.log("edit slide down");
    }
    else {
        $('#edit_track_' + id).addClass("hide_form");
        //console.log("edit add hide");
        $('#edit_track_' + id).slideUp();
        //console.log("edit slide up");
    }
}

function show_feeds_for_track(track) {
    const tr = track.closest('tr');
    const row = $('#tracks').DataTable().row(tr);
    const id = row.data().TrackID;

    if (!row.child.isShown()) {
        row.child(fnFormatDetails(id)).show();
    }

    const ckey = 'openRows_' + id;
    let val = parseInt(getCookie(ckey));
    if ($('#feeds_for_track_' + id).hasClass("hide_form")) {
        val = (val != NaN) ? (val | FEEDS_TBL_OPENED_FG) : FEEDS_TBL_OPENED_FG;
    }
    else {
        val = (val != NaN) ? (val & ~FEEDS_TBL_OPENED_FG) : 0;
    }
    setCookie(ckey, val.toString(), 10000);

    show_feeds_for_track_inner(row);
}

function show_feeds_for_track_inner(row) {
    const id = row.data().TrackID;

    if ($('#feeds_for_track_' + id).hasClass('hide_form')) {
        $('#feeds_for_track_' + id).removeClass('hide_form')
        console.log("table remove hide");
        $('#feeds_for_track_' + id).slideDown();
        $('#bind_' + id).removeClass("hidden");
        console.log("table slide down");
    }
    else {
        $('#feeds_for_track_' + id).addClass('hide_form')
        console.log("table add hide");
        $('#bind_' + id).addClass("hidden");
        $('#feeds_for_track_' + id, row.child()).slideUp();
        console.log("table slide up");
    }

    if ($("#track_feeds_" + id).hasClass('table_inited')) {
        console.log("rerender");
        $("#track_feeds_" + id).DataTable().draw(false);
    }
    else {
        $("#track_feeds_" + id)
            .on("draw.dt", function (event) {
                // stop bubbling
                event.stopPropagation();
            })
            .DataTable({
                data: feeds,
                "bProcessing": false,
                //"bServerSide": true,
                stateSave: true,
                paging: true,
                pageLength: FEED_PAGE_LEN_DEF,
                searching: true,
                order: [[1, 'asc']],
                "fnInitComplete": function () {
                    //console.log('INIT COMPLETE');
                    $("#track_feeds_" + id).addClass('table_inited');
                },
                "fnPreDrawCallback": function (settings) {
                    this.removeClass('hide_row');
                    //console.log('COMPLETE');
                    //cb
                },
                "fnRowCallback": function (row, data, dataIndex) {
                },
                columns: [
                    {
                        'orderable': false,
                        width: 50,
                        "data": null,
                        'render': function (data, type, full, meta) {
                            return type === 'display' ?
                                "<a type='button' class='btn btn-default btn-xs' target='_blank' href='" + data.Path + "' role='button'>" +
                                "<i class='fa fa-play'/> play" +
                                "</a>" :
                                "";
                        }
                    },
                    {
                        'data': 'Title',
                        'render': function (data, type, full, meta) {
                            return type === 'display' && data.length > 40 ?
                                '<span title="' + data + '">' + data.substr(0, 38) + '...</span>' :
                                data;
                        }
                    },
                    { 'data': 'Tags' },
                    {
                        'data': 'CreateTS',
                        'render': function (data, type, full, meta) {
                            return new Date(data).toISOString();
                        }
                    },
                    {
                        'data': null,
                        'name': 'Owned',
                        "render": function (data, type, full, meta) {
                            const track_feed_map_clone = track_feed_map;
                            let owned = false;
                            for (let i = 0; i < track_feed_map_clone.length; i++) {
                                const entry = track_feed_map_clone[i];
                                if (entry.TrackID == id && entry.FeedID == data.FeedID) {
                                    owned = true;
                                    console.log("owned");
                                    break;
                                }
                            }
                            return type === 'display' ?
                                '<div class="btn-group">' +
                                "<button type='button' id='bind_" + data.FeedkID + "' onClick='bind_unbind_track_feed(this)' class='btn btn-default btn-xs'>" +
                                "<i id='feed_plus_" + data.FeedID + id + "' class='fa fa-plus " + ((owned) ? 'hidden' : '') + "'></i>" +
                                "<i id='feed_minus_" + data.FeedID + id + "' class='fa fa-minus " + ((!owned) ? 'hidden' : '') + "'></i>" +
                                "</button>" +
                                '</div>' :
                                ((owned) ? '&-' : '&+');
                        }
                    }
                ]
            });
    }
}

$(document).ready(function () {

    $("#add_track_form_upload_track").on('change', function () {
        const files = $(this).get(0).files;

        $('#add_track_form_title').val('');
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if ($('#add_track_form_title').val() === '')
                    $("#add_track_form_title").val(file.name.substring(0, file.name.lastIndexOf('.')));
                else {
                    $("#add_track_form_title").val($("#add_track_form_title").val() + ', ' + file.name.substring(0, file.name.lastIndexOf('.')));
                }
            }
            // TODO temp till more adv UI
            if (files.length) $("#add_track_form_title").attr('disabled', 'disabled');
        }
    });

    $('#add_track_form').submit(function (event) {
        event.preventDefault();
        const $form = $(this);
        const url = $form.attr('action');

        const files = $('#add_track_form_upload_track').get(0).files;
        if (!files.length) {
            console.error('NO files selected');
            alert('NO files selected');
            return;
        }

        if (files.length > UPLOAD_LIMIT) {
            console.error('UPLOAD_LIMIT ' + UPLOAD_LIMIT + ' eceeded: ' + files.length);
            alert('UPLOAD_LIMIT ' + UPLOAD_LIMIT + ' eceeded: ' + files.length);
            return;
        }

        $("#add_track").append('<div id="add_track_ovl" class="overlay"> <i class="fa fa-music fa-spin"></i> </div>');

        if (files.length > 0) {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                formData.append('uploads[]', file, file.name);
                console.log(file);
            }
            formData.append('title', $('#add_track_form_title').val())
            formData.append('tags', $('#add_track_form_tags').val())
            formData.append('url', $('#add_track_form_upload_track').val())
            //formData.append('description', $('#add_track_form_descr').val())
            //formData.append('filename', $('#add_track_form_uploaded_file_name').val())

            $.ajax({
                type: "POST",
                url: "/upload",
                //cache: true,
                processData: false,
                contentType: false,
                data: formData,
                complete: function (xrs, textStatus, error) {
                    $('#add_track').addClass("hide_form");

                    $('#add_track').slideUp(function () {
                        $('#add_track_form')[0].reset();
                        $("#add_track_ovl").remove();
                    });
                },
                success: function (upl_data) {
                    console.log('upload succ');
                    console.log(upl_data);
                    if (upl_data.Items != undefined) {
                        console.log(upl_data.Errs);
                        upl_data.Items.map((it) => {
                            tracks.push(it);
                            const row = $('#tracks').DataTable().row.add(it).draw(false).node();
                            $('#tracks').DataTable().page('last').draw(false);
                            $('html, body').animate({
                                scrollTop: $(row)[0].offsetTop
                            }, 500);
                        });
                    }
                    else {
                        console.error('upload failed: ' + upl_data);
                    }
                },
                error: function (data, err, err1) {
                    console.error('upload err ' + err);
                },
                xhr: function () {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener('progress', function (evt) {
                        if (evt.lengthComputable) {
                            const percentComplete = evt.loaded / evt.total;
                            percentComplete = parseInt(percentComplete * 100);
                            console.log(percentComplete);
                        }
                    },
                        false);

                    return xhr;
                }
            });
        }
    });

    $("#tracks_box").append('<div id="tracks_box_ovl" class="overlay"> <i class="fa fa-refresh fa-spin"></i> </div>');

    reload_data_ftm(function (err) {
        $('#tracks')
            .on("page.dt", function () {
                console.log("page change" + $("#tracks").DataTable().page.info().page);
            })
            .on("draw.dt", function () {
                render_curr_page_row_children();
            })
            .DataTable({
                data: tracks,
                "bProcessing": false,
                //"bServerSide": true,
                stateSave: true,
                paging: true,
                pageLength: TRACK_PAGE_LEN_DEF,
                searching: true,
                order: [[1, 'asc']],
                columns: [
                    {
                        "orderable": false,
                        width: 50,
                        "data": null,
                        'render': function (data, type, full, meta) {
                            return type === 'display' ?
                                "<a type='button' class='btn btn-default btn-xs' target='_blank' href='" + S3_URL_PREFIX + "/" + data.UserID + "/upload/" + data.Path + "' role='button'>" +
                                "<i class='fa fa-play'/> play" +
                                "</a>" :
                                "";
                        }
                    },
                    {
                        'data': 'Title',
                        'render': function (data, type, full, meta) {
                            return type === 'display' && data != undefined && data.length > 40 ?
                                '<span title="' + data + '">' + data.substr(0, 38) + '...</span>' :
                                data;
                        }
                    },
                    { 'data': 'Tags' },
                    {
                        'data': 'CreateTS',
                        'render': function (data, type, full, meta) {
                            return new Date(data).toISOString();
                        }
                    },
                    {
                        "className": 'details-control',
                        'data': null,
                        "render": function (data, type, full, meta) {
                            let c = 0;
                            const track_feed_map_clone = track_feed_map;
                            for (let i = 0; i < track_feed_map_clone.length; i++) {
                                const entry = track_feed_map_clone[i];
                                if (entry.TrackID == data.TrackID) {
                                    ++c;
                                }
                            }
                            return type === 'display' ?
                                '<div class="btn-group">' +
                                "<button type='button' id='" + data.TrackID + "' onClick='show_feeds_for_track(this)' class='btn btn-default btn-xs'><i class='fa fa-feed'></i> feeds <span class='badge " + ((c > 0) ? "bg-green'>" : "'>") + c + "</span></button>" +
                                "<button type='button' value='" + data.TrackID + "' id='bind_" + data.TrackID + "' onClick='filter_all_bound_feeds(this)' class='btn btn-default btn-xs hidden'>" +
                                '</div>' :
                                data.AttachedToFeedsNumber;
                        }
                    },
                    {
                        "orderable": false,
                        width: 50,
                        'data': null,
                        "render": function (data, type, full, meta) {
                            return type === 'display' ?
                                '<div class="btn-group-horizontal">' +
                                '<button type="button" id="' + data.TrackID + '" onClick="show_edit_track(this)" class="btn btn-default btn-xs"><i class="fa fa-edit"></i>edit</button>' +
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
                                '<div class="btn-group-horizontal">' +
                                '<button type="button" id="' + data.TrackID + '" onClick="remove_track(this)" class="btn btn-default btn-xs"><i class="fa fa-remove"></i>remove</button>' +
                                '</div>' :
                                '';
                        }
                    }
                ]
            });

        $("#tracks_box_ovl").remove();

        function render_curr_page_row_children() {
            //var c = 0;
            $("#tracks").DataTable().rows({ page: 'current' }).every(function (rowIdx, tableLoop, rowLoop) {
                const row = this;
                const id = row.data().TrackID;
                const ckey = 'openRows_' + id;
                const val = parseInt(getCookie(ckey));

                if (val != NaN) {
                    if (!row.child.isShown()) {
                        //console.log('render');
                        row.child(fnFormatDetails(id)).show();

                        if (val & FEEDS_TBL_OPENED_FG) {
                            $('#feeds_for_track_' + id).removeClass('slider');
                            show_feeds_for_track_inner(row);

                            $("#minus_" + id).removeClass("hidden");
                            $("#plus_" + id).addClass("hidden");
                        }

                        if (val & EDIT_TRACK_OPENED_FG) {
                            $('#edit_track_' + id).removeClass('slider');
                            show_edit_track_inner(row);
                        }
                    }
                }
            });
        }
    });
});

function fnFormatDetails(table_id) {
    //alert(table_id);
    const div =
        '<div class="container" style="width: 100%;">' +

        '<div id="edit_track_' + table_id + '" class="row slider varod hide_form">' +
        "<form class='form-vertical' id='edit_track_form_" + table_id + "' action='' method='post'>" +
        "<div class='form-group form-row' style='width: 100%;'>" +
        "<label class='col-md-2 col-form-label'>Url</label>" +
        "<div class='col-md-10'>" +
        "<input id='edit_track_form_upload_track_" + table_id + "' type='file' class='filestyle' data-buttonText='' data-buttonBefore='true' data-buttonName='btn-default btn-xs varod' style='width: 100%; !important;'>" +
        "</div>" +
        "</div>" +
        "<div class='form-group form-row' style='width: 100%;'>" +
        "<label class='col-md-2 col-form-label'>Title</label>" +
        "<div class='col-md-10'>" +
        "<input id='edit_track_form_title_" + table_id + "' type='text' class='form-control' style='width: 100%;'/>" +
        "</div>" +
        "</div>" +
        "<div class='form-group form-row'  style='width: 100%;'>" +
        "<label class='col-md-2 col-form-label'>Tags</label>" +
        "<div class='col-md-10'>" +
        "<input id='edit_track_form_tags_" + table_id + "' type='text' class='form-control' style='width: 100%;'/>" +
        "</div>" +
        "</div>" +
        /*
        "<div class='form-group form-row' style='width: 100%;'>" +
            "<label class='col-md-2 col-form-label'>Description</label>" +
            "<div class='col-md-10'>" +
                "<input id='edit_track_form_descr_" + table_id + "' type='text' class='form-control' style='width: 100%;'/>" +
            "</div>" +
        "</div>" +
        */
        "<div class='form-group form-row'  style='width: 100%;'>" +
        "<label class='col-md-2 col-form-label'></label>" +
        "<div class='col-md-10'>" +
        '<button type="submit" class="btn btn-success btn-xs" style="float: right;">Submit</button>' +
        '<button type="button" id="' + table_id + '" onClick="cancel_edit_track(this.id)" class="btn btn-default btn-xs" style="float: right;">Close</button>' +
        "</div>" +
        "</div>" +
        "</form>" +
        '</div>' +

        '<div id="feeds_for_track_' + table_id + '" class="row red slider hide_form">' +
        '<div class="red" style="width: 100%;">' +
        '<table id="track_feeds_' + table_id + '" class="display table-compact table-bordered hide_row" cellpadding="0" cellspacing="0" border="0" style="padding-left:9px; width:100%;">' +
        '<thead>' +
        '<tr class="red">' +
        '<th></th>' +
        '<th>Title</th>' +
        '<th>Tags</th>' +
        '<th>Date</th>' +
        '<th></th>' +
        '<th></th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '</tbody>' +
        '</table>'
        + '</div>'
        + '</div>'

        + '</div>'
        ;

    return div;
}