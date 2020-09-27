
let kws = {};
let feeds = {};

function reload_data(callback) {
    $.ajax({
        type: "POST",
        url: "/get_tubes_kws",
        data: {},
        success: function (data) {
            console.log(data);
            feeds = data.Tubes.Items;
            kws = data.KWs.Items;
            callback(null, data);
        },
        error: function (err) {
            console.error(err);
            callback(err, null);
        }
    });
}

//feeds
function add_feed() {
    if ($('#add_feed').hasClass("hide_form")) {
        $('#add_feed').removeClass("hide_form");
        $('#add_feed').slideDown();
    }
    else {
        $('#add_feed').addClass("hide_form");
        $('#add_feed').slideUp();
    }
}

function cancel_add_feed() {
    if ($('#add_feed').hasClass("hide_form")) {
        console.log('should not happen');
    }
    else {
        $('#add_feed').addClass("hide_form");
        $('#add_feed').slideUp(function () {
            $('#add_feed_form')[0].reset();
        });
    }
}

function commit_edit_feed(edit_feed) {
    console.log("commit_edit_feed");
    const id = edit_feed.id;
}

function cancel_edit_feed(edit_feed) {
    const id = edit_feed.id;

    if ($('#edit_feed_' + id).hasClass("hide_form")) {
        console.log('should not happen');
    }
    else {
        $('#edit_feed_' + id).addClass("hide_form");
        $('#edit_feed_' + id).slideUp(function () { });
    }
}

function remove_feed(feed) {
    const tr = feed.closest('tr');
    const row = $('#feeds').DataTable().row(tr);
    const id = row.data().FeedID;

    $.ajax({
        type: "POST",
        url: "/remove_feed",
        data: { feedID: id },
        success: function (data) {
            // TODO consider remove from map as well
            // remove feed / remove row redraw
            let found = false;
            for (let i = 0; i < feeds.length; i++) {
                const entry = feeds[i];
                if (entry.FeedID == id) {
                    feeds.splice(i, 1);
                    found = true;
                    break;
                }
            }
            if (!found) console.error("WARNING desync of data/representation")
            $('#feeds').DataTable().row(tr).remove().draw(false);
        },
        error: function (err) {
            console.error(err);
        }
    });
}

function run_stop_feed(feed) {
    if ($("#run_" + feed.id).hasClass("hidden")) {
        $("#stop_" + feed.id).addClass("fa-spin");
        $(feed).addClass("disabledbutton");
    }
    else {

        $("#run_" + feed.id).addClass("fa-spin");
        $(feed).addClass("disabledbutton");
    }
}


const EDIT_FEED_OPENED_FG = 1;
const TRACKS_TBL_OPENED_FG = 2;

function show_edit_feed(feed) {
    const tr = feed.closest('tr');
    const row = $('#feeds').DataTable().row(tr);
    const id = row.data().FeedID;

    if (!row.child.isShown()) {
        row.child(fnFormatDetails(id)).show();
    }

    const ckey = 'openRows_' + id;
    let val = parseInt(getCookie(ckey));
    if ($('#edit_feed_' + id).hasClass("hide_form")) {
        val = (val != NaN) ? (val | EDIT_FEED_OPENED_FG) : EDIT_FEED_OPENED_FG;
    }
    else {
        val = (val != NaN) ? (val & ~EDIT_FEED_OPENED_FG) : 0;
    }
    setCookie(ckey, val.toString(), 10000);

    show_edit_feed_inner(row);
}

function show_edit_feed_inner(row) {
    const id = row.data().FeedID;

    $('#edit_feed_form_title_' + id).val(row.data().Title);
    $('#edit_feed_form_tags_' + id).val(row.data().Tags);
    $('#edit_feed_form_url_' + id).val(row.data().Path);

    if ($('#edit_feed_' + id).hasClass("hide_form")) {
        $('#edit_feed_' + id).removeClass("hide_form");
        //console.log("edit remove hide");
        $('#edit_feed_' + id).slideDown(function () { });
        //console.log("edit slide down");
    }
    else {
        $('#edit_feed_' + id).addClass("hide_form");
        //console.log("edit add hide");
        $('#edit_feed_' + id).slideUp(function () { });
        //console.log("edit slide up");
    }
}

$(document).ready(function () {
    
    $('#add_feed_form').submit(function (event) {

        $("#add_feed").append('<div id="add_feed_ovl" class="overlay"> <i class="fa fa-feed fa-spin"></i> </div>');

        event.preventDefault();
        const $form = $(this);
        const url = $form.attr('action');

        $.ajax({
            type: "POST",
            url: url,
            cache: true,
            data: {
                title: $('#add_feed_form_title').val(),
                tags: $('#add_feed_form_tags').val(),
                url: $('#add_feed_form_url').val(),
                //description: $('#add_feed_form_descr').val(),
            },
            dataType: 'text json',
            complete: function (xrs, textStatus, error) {
                $('#add_feed').addClass("hide_form");

                $('#add_feed').slideUp(function () {
                    $('#add_feed_form')[0].reset();
                    $("#add_feed_ovl").remove();
                });
            },
            success: function (data) {
                console.log("add feed succ");
                // add feed / add row redraw
                //console.log(data);
                feeds.push(data);
                const row = $('#feeds').DataTable().row.add(data).draw(false).node();
                $('#feeds').DataTable().page('last').draw(false);
                $('html, body').animate({
                    scrollTop: $(row)[0].offsetTop
                }, 500);
            },
            error: function (err) {
                console.error(err);
            }
        });
    });

    $("#feeds_box").append('<div id="feeds_box_ovl" class="overlay"> <i class="fa fa-refresh fa-spin"></i> </div>');
    $("#kw_box").append('<div id="kw_box_ovl" class="overlay"> <i class="fa fa-refresh fa-spin"></i> </div>');

    reload_data(function (err) {
        $('#kws')
            .on("page.dt", function () {
                console.log("page change" + $("#kws").DataTable().page.info().page);
            })
            .on("draw.dt", function () {
            })
            .DataTable({
                data: kws,
                "bProcessing": false,
                //"bServerSide": true,
                stateSave: true,
                paging: true,
                pageLength: FEED_PAGE_LEN_DEF,
                searching: true,
                order: [[1, 'asc']],
                columns: [
                    { 'data': 'KW' },
                    { 'data': 'Priority' }
                ]
            });

        $('#feeds')
            .on("page.dt", function () {
                console.log("page change" + $("#feeds").DataTable().page.info().page);
            })
            .on("draw.dt", function () {
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
                columns: [
                    { 'data': 'Tube' },
                    {
                        "orderable": false,
                        width: 50,
                        "data": null,
                        'render': function (data, type, full, meta) {
                            return "Active"
                        }
                    },
                ]
            });

        $("#feeds_box_ovl").remove();
        $("#kw_box_ovl").remove();
    });
});
