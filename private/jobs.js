
let jobs = {};

function remove_job(job) {
    const tr = job.closest('tr');
    const row = $('#jobs').DataTable().row(tr);
    const id = row.data().JobID;

    $.ajax({
        type: "POST",
        url: "/remove_job",
        data: { jobID: id },
        complete: function (xrs, textStatus, error) {
            console.log(textStatus);
            
            let found = false;
            for (let i = 0; i < jobs.length; i++) {
                const entry = jobs[i];
                if (entry.JobID == id) {
                    jobs.splice(i, 1);
                    found = true;
                    break;
                }
            }
            if (!found) console.error("WARNING desync of data/representation")
            $('#jobs').DataTable().row(tr).remove().draw(false);

        }
    });
}

function reload_data(callback) {
    $.ajax({
        type: "POST",
        url: "/get_jobs",
        data: {},
        success: function (data) {
            console.log(data);
            jobs = data.Items;
            callback(null, data);
        },
        error: function (err) {
            console.error(err);
            callback(err, null);
        }
    });
}

$(document).ready(function () {
    
    reload_data(function (err) {
        $('#jobs')
            .on("page.dt", function () {
                console.log("page change" + $("#jobs").DataTable().page.info().page);
            })
            .on("draw.dt", function () {
                //render_curr_page_row_children();
            })
            .DataTable({
                data: jobs,
                "bProcessing": false,
                //"bServerSide": true,
                paging: true,
                pageLength: 25,
                searching: true,
                columns: [
                    { 'data': 'UserID' },
                    { 'data': 'JobID' },
                    { 'data': 'FeedID' },
                    { 'data': 'EntityID' },
                    { 'data': 'UpdateTS' },
                    {
                        'data': 'Title',
                        'render': function (data, type, full, meta) {
                            return type === 'display' && data != undefined && data.length > 40 ?
                                '<span title="' + data + '">' + data.substr(0, 38) + '...</span>' :
                                data;
                        }
                    },
                    { 'data': 'Tags' },
                    { 'data': 'Path' },
                    { 'data': 'OperationalState' },
                    { 'data': 'SourceInfoJSON' },
                    { 'data': 'ArchPID' },
                    {
                        "orderable": false,
                        width: 50,
                        'data': null,
                        "render": function (data, type, full, meta) {
                            return type === 'display' ?
                                    '<div class="btn-group-vertical">' +
                                        '<button type="button" id="' + data.JobID + '" onClick="remove_job(this)" class="btn btn-default btn-xs"><i class="fa fa-remove"></i>remove</button>' +
                                    '</div>' :
                                    '';
                        }
                    }
                ],
                "order": [[1, 'asc']]
         });
    });
});
