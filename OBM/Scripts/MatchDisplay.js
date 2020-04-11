﻿function sharedFunction(id) {
    //console.log("hello " + id);
    var state = $('#busyState' + id).val();

    if (state == "b") {
        $("#busyState").toggleClass("btn-outline-danger btn-outline-success");
        $("#busyState").val("a");
        $("#busyState").text("a");
    }
    else {
        $("#busyState").toggleClass("btn-outline-success btn-outline-danger");
        $("#busyState").val("b");
        $("#busyState").text("b");
    }

    $.ajax({
        type: 'POST',
        url: '/Events/Competitor/' + id,
        success: ajax_match,
        error: errorOnAjax
    });
}

var interval = 1000 * 5;

var ajax_match_update = function () {
    var eventID = $("#eventID").val();
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: '/Events/MatchUpdate?id=' + eventID,
        complete: setTimeout(ajax_match, 0),
        error: errorOnAjax
    });
}

var ajax_call = function () {
    var eventID = $('#eventID').val();
    //console.log(eventID);
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: '/Events/MatchList?id=' + eventID,
        success: MatchList,
        complete: setTimeout(ajax_match_update, 0),
        error: errorOnAjax
    });
}

var ajax_match = function () {
    var eventID = $('#eventID').val();
    //console.log(eventID);
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: '/Events/CompetitorList?id=' + eventID,
        success: CompetitorList,
        complete: setTimeout(ajax_call, interval),
        error: errorOnAjax
    });
}

function CompetitorList(data) {
    $('#Competitors').html(data["compTable"]);
}

function MatchList(data) {
    $('#Matches').html(data["matchTable"]);
}

function errorOnAjax() {
    console.log("ERROR in ajax request.");
}

window.setTimeout(ajax_call, 0);

var ajaxMatches = function () {
    var id = $('#EventID').val();
    //console.log(id);
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: '/Events/Matches/' + id.toString(),
        success: drawTree,
        error: errorOnAjax
    });
}

function lineage(data, current, currY, childY, e, offset) {
    var dataList = [];
    var base = 1;
    var latest = moment().add(5, 'minutes');
    var latest = moment(latest).add(((current.Round - 1) * 15), 'minutes');
    var nodeLineColor = 'red';

    if (current.PrereqMatch1ID != null) {
        var parent = data.find(item => item.MatchID === current.PrereqMatch1ID);
        var parentY = currY + (base / Math.pow(2, e));
        var parentResults = recursiveCall(data, parent, parentY, currY, e + 1, offset);
        dataList = dataList.concat(parentResults.dl);
    }

    if (current.PrereqMatch2ID != null) {
        var parent = data.find(item => item.MatchID === current.PrereqMatch2ID);
        var parentY = currY - (base / Math.pow(2, e));
        var parentResults = recursiveCall(data, parent, parentY, currY, e + 1, offset);
        dataList = dataList.concat(parentResults.dl);
    }

    if (current.Winner == null) {
        if (current.Time == null) {
            nodeLineColor = 'gray';
        }
        else {
            nodeLineColor = '#3895d3';
        }
    }
    else {
        nodeLineColor = '#03c04a';
    }

    var matchName = "";
    if (current.Competitor1Name != "" && current.Competitor2Name != "") {
        matchName = current.Competitor1Name + " vs " + current.Competitor2Name;
    }
    else if (current.Competitor1Name != "") {
        matchName = current.Competitor1Name + " vs --";
    }
    else if (current.Competitor2Name != "") {
        matchName = current.Competitor2Name + " vs --";
    }
    else {
        matchName = "Round " + current.Round + " Match";
    }

    var node = [{
        data: [{
            x: latest,
            y: currY + offset
        }],
        fill: false,
        title: matchName,
        label: latest.format('LT') + " - " + current.TournamentName,
        backgroundColor: nodeLineColor,
        pointHoverBackgroundColor: nodeLineColor,
        pointHoverRadius: 30
    }];

    return {
        node: node,
        nodeLineColor: nodeLineColor,
        dataList: dataList
    };
}

function recursiveCall(data, current, currY, childY, e, offset) {
    var dataList = [];
    var latest = moment().add(5, 'minutes');
    var latest = moment(latest).add(((current.Round - 1) * 15), 'minutes');
    var nodeLineColor = 'red';

    var get = lineage(data, current, currY, childY, e, offset);
    dataList = dataList.concat(get.dataList);
    nodeLineColor = get.nodeLineColor;
    var node = get.node;

    var line = {
        data: [{
            x: latest,
            y: currY + offset
        },{
            x: moment(latest).add((15), 'minutes'),
            y: childY + offset
        }],
        fill: false,
        radius: -1,
        pointRadius: [-1],
        backgroundColor: nodeLineColor,
        borderWidth: 5,
        borderColor: nodeLineColor
    };

    node.push(line);
    dataList = dataList.concat(node);

    var send = {
        dl: dataList,
        last: latest
    };

    return send;
}

function drawTree(data) {

    var trees = [data[0]];
    var largestRound = 2;

    for (var j = 0; j < trees.length; j++) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].TournamentID == trees[j].TournamentID) {
                if (data[i].Round > trees[j].Round) {
                    trees[j] = data[i];
                    if (data[i].Round > largestRound) {
                        largestRound = data[i].Round;
                    }
                }
            }
            else {
                var flag = 1;
                for (var h = 0; h < trees.length; h++) {
                    if (data[i].TournamentID == trees[h].TournamentID) {
                        flag = 0;
                        h = trees.length;
                    }
                }
                if (flag == 1) {
                    trees.push(data[i]);
                }
            }
        }
    }

    var dataList = [];
    for (var i = 0; i < trees.length; i++) {
        var current = trees[i];
        var base = 1;
        var offset = i * (trees[i].Round - 1);

        var get = lineage(data, current, base, base, base, offset);
        dataList = dataList.concat(get.dataList);
        nodeLineColor = get.nodeLineColor;
        var node = get.node;

        dataList = dataList.concat(node);
    }

    var hidden = [{
        data: [{
            x: moment(),
            y: 0
        }],
        fill: false,
        radius: -1,
        pointRadius: [-1]
    }];

    dataList = dataList.concat(hidden);

    largestRound = largestRound - 2;
    if (largestRound < 0) {
        largestRound = 0;
    }
    
    var ctx = document.getElementById('myChart');
    ctx.height = 100 * trees.length * largestRound;
    var myChart = new Chart(ctx, {
        type: 'line',
        data: { datasets: dataList },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: {
                padding: {
                    top: 50,
                    left: 50,
                    right: 50,
                    bottom: 50
                }
            },
            title: {
                display: false
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    display: true,
                    time: {
                        displayFormats: {
                            quarter: 'h:mm a'
                        },
                        unit: 'minute',
                        unitStepSize: 5
                    }
                }],
                yAxes: [{
                    display: false
                }]
            },
            elements: {
                point: {
                    radius: 15
                }
            },
            hover: {
                mode: 'nearest'
            },
            tooltips: {
                callbacks: {
                    title: function (tooltipItem, data) {
                        return data.datasets[tooltipItem[0].datasetIndex].title;
                    },
                    label: function (tooltipItem, data) {
                        return data.datasets[tooltipItem.datasetIndex].label;
                    }
                },
                backgroundColor: '#808080',
                titleFontSize: 17,
                titleFontColor: '#DCDCDC',
                bodyFontSize: 14,
                bodyFontColor: '#DCDCDC',
                displayColors: false
            }
        }
    });
}

window.onload = ajaxMatches;

function hideShow(div) {
    console.log("trying");
    var x = document.getElementById(div);
    if (window.getComputedStyle(x).display === "none") {
        x.style.display = "block";
    }
    else {
        x.style.display = "none";
    }
}