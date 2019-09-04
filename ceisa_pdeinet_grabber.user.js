// ==UserScript==
// @name         grab_pde_internet
// @namespace    scrapper
// @version      0.1
// @description  ambil data dari browse pde internet
// @author       Bowie
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @include      *
// ==/UserScript==

var AppState = {
    "scrapping":1,
    "waiting":2,
    "done":3,
    "ready":4,
    "paused":5
};

var appState = AppState.ready;

var btnNext, txtCurrPage, txtTotalPage;
var appInstance=0;

var pageCurr = 1, pageTotal = 1;
var lastScrappedPage = 0;
var scrappedData = [];

function initReading() {
    btnNext = $('button.z-paging-next')[1];
    txtCurrPage = $('input.z-paging-inp')[1];
    txtTotalPage = $('span.z-paging-text')[3];

    var patTotalPage = /^\/\s+(\d+)/i;
    var matTotalPage = patTotalPage.exec($(txtTotalPage).text());

    pageTotal = parseInt(matTotalPage[1]);
    pageCurr = parseInt($(txtCurrPage).val());

    var msg = "current page: " + pageCurr + "\n"
    + "total page: " + pageTotal;
}

function convertToCSVData(content) {
    // build flat array
    var res = "sep=,\r\n" + 'idPPJK, namaPPJK, idImportir, namaImportir, totalPIB, totalPIBInet, totalPIBProvider, totalPIBDisket';
    res += "\r\n";

    for (var i=0; i<content.length; i++) {
        var data = content[i];

        res += "=\"" + data.idPPJK + '",';
        res += '"' + data.namaPPJK + '",';
        res += "=\"" + data.idImportir + '",';
        res += '"' + data.namaImportir +'",';
        res += '"' + data.totalPIB + '",';
        res += '"' + data.totalPIBInet + '",';
        res += '"' + data.totalPIBProvider + '",';
        res += '"' + data.totalPIBDisket + '"';
        res += "\r\n";
    }

    return res;

}

function initScrapping() {
    scrappedData = [];
    appState = AppState.scrapping;
    lastScrappedPage = 0;

    initReading();
}

function createDownloadLink(filename, dataUri) {
    var link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', filename);
    link.text = "Download Scrapped Data";
    link.style.color = "#fff";
    link.style.background = "#000";

    $('#downLink').html('');
    $('#downLink').append(link);
}

function setAppState(state) {
    appState = state;
    switch(state) {
        case AppState.scrapping:
            $('#scrapStatus').text("STAT: SCRAPPING...");
            break;
        case AppState.waiting:
            $('#scrapStatus').text("STAT: LOADING PAGE " + (pageCurr+1));
            break;
        case AppState.done:
            $('#scrapStatus').text('DONE SCRAPPING. SCRAPPED ROWS: ' + scrappedData.length);
            alert("SCRAPPING DONE! Scrapped data rows: " + scrappedData.length);

            var csvContent = "data:textcsv; charset=utf-8," + convertToCSVData(scrappedData) ;
            var encodedURI = encodeURI(csvContent);

            createDownloadLink('scrapped.csv', encodedURI);

            break;
        case AppState.ready:
            $('#scrapStatus').text('READY!');
            break;
        case AppState.paused:
            $('#scrapStatus').text('PAUSED');
            break;
        default:
            $('#scrapStatus').text("Error state: " + state);

    }
}

function refreshPageData() {
}

function startScrapping() {
    // we're done scrapping. Do Nothing.
    if (appState == AppState.done)
        return;

    // we're scrapping now or waiting
    if (appState == AppState.scrapping) {
        // do something
        initReading();
        // are we done yet?

        //
        if (parseInt(pageCurr) < parseInt(pageTotal) && parseInt(lastScrappedPage) < parseInt(pageCurr) ) {
            // show status
            var txt = "Scrapping page: "+pageCurr + "/"+pageTotal+", last: " + lastScrappedPage;
            $("#scrapStatus").text(txt);
            // do scrapping here
            scrapFromPage(scrappedData);
            // advance
            lastScrappedPage = pageCurr;
            // click that button and set state to wait
            $(btnNext).click();

        } else if (parseInt(lastScrappedPage) >= parseInt(pageCurr)) {
            console.log("Abnormal cause: " + lastScrappedPage + ", " + pageCurr);
        } else {
            // one last scrap
            if (pageTotal != 1) {
                // do scrapping
                scrapFromPage(scrappedData);
            }
            // we're done
            console.log("STOPPED!: " + pageCurr +" : "+pageTotal+" : "+lastScrappedPage);
            console.log(scrappedData);

            setAppState(AppState.done);
            return;
        }
    } else if (appState == AppState.waiting) {
        if (isProcessing()) {
            // do nothing
        } else {
            // it's over, change to scrapping
            setAppState(AppState.scrapping);
        }
    } else if (appState == AppState.ready) {
        // switch state
        setAppState(AppState.scrapping);
    }

    // call self in the future
    appInstance = setTimeout(function() {
        startScrapping();
    }, 1000);
}

function scrapFromPage(target) {
    var divs = $('td.z-listcell div.z-listcell-cnt');

    for (var i=0; i<divs.length/8; i++) {
        var data = {
            "idPPJK": divs[i*8+0].innerText,
            "namaPPJK": divs[i*8+1].innerText,
            "idImportir": divs[i*8+2].innerText,
            "namaImportir": divs[i*8+3].innerText,
            "totalPIB": divs[i*8+4].innerText,
            "totalPIBInet": divs[i*8+5].innerText,
            "totalPIBProvider": divs[i*8+6].innerText,
            "totalPIBDisket": divs[i*8+7].innerText,
        };

        target.push(data);

        //console.log(data);
    }

    //console.log(target);
}

function initElements() {
    var appControl = '<div style="position:fixed; top:4px; left:4px; z-index:9999; background: #347; color:#fff;">'
    +'<button id="btnCheck" type="button">Initial_Reading</button>'
    +'<button id="btnStart" type="button">START</button>'
    +'<p id="scrapStatus">'
    +   'STAT GOES HERE!!'
    +'</p>'
    +'<div id="downLink"></div>'
    +'</div>';

    if ($('#btnCheck').length == 0) {
        $('body').append(appControl);

        // set handlers
        $('#btnCheck').click(function() {
            initReading();
            setAppState(AppState.ready);
        } );

        $('#btnStart').click(function() {
            if (appState == AppState.ready) {
                initScrapping();
                // start the scrapping
                startScrapping();
            } else if (appState == AppState.scrapping) {
                //appState = AppState.paused;
                setAppState(AppState.paused);
            } else if (appState == AppState.paused) {
                //appState = AppState.scrapping;
                setAppState(AppState.scrapping);
            } else if (appState == AppState.done) {
                //appState = AppState.ready;
                setAppState(AppState.ready);
            }
        });
    }
}

function isProcessing() {
    return ($('div:contains("Processing")')).length > 0;
}

function insertStatForm() {
}

$(function() {
    var bodyPart = $('body.gecko');

    if (bodyPart.length > 0) {
        console.log("Am I here?");

        var menuBar = $('.z-menubar-hor')[0];

        menuBar.style.background = '#62e';

        $(document).on("click", 'a:contains("Asal Data")', function() {
            setTimeout(initElements, 1000);
        } );
    }
});