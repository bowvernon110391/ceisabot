// ==UserScript==
// @name        ceisa_CN_grabber
// @namespace   my_testcase
// @description To grab all available CN data
// @include     *
// @version     1
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       unsafeWindow
// @grant       GM_xmlhttpRequest
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @resource    homepagev1 http://192.168.146.250/autograbber/CN_grabber.php
// ==/UserScript==

//additional method to check if jquery selected item exists
jQuery.fn.exists = function(){return this.length>0;}

function sortnumeric(a, b){
  return parseInt(a)-parseInt(b);
}

//==========================================================================

//now it's for data passing
var add_data_pfpd={data:null, flags:[]};
//the global data
var main_data_pfpd={data:null, flags:[]};
//current index
var current_id=0; //start from zero
//current state
var current_state=-1; //-1:homepage 0:input no+tglpib
//current timer
var timer=null;
//==========================================================================

//fungsi ini ngambil data dari tabel main_source brdsrkn id
//id = zero based
function get_data_pib(id){
  var rowname='#main_source tbody > tr:nth-child('+(id+1)+')';
  var row=$(rowname);
  //ada gak?
  if(row.length){
    //ada. bikin objeknya
    //alert('data id '+id+' exists!');
    var no=$(rowname+' td:nth-child(1)').text();
    var nopib=$(rowname+' td:nth-child(2)').text();
    var tglpib=$(rowname+' td:nth-child(3)').text();
    var importir=$(rowname+' td:nth-child(4)').text();
    
    var data={
      d_no:no,
      d_nopib:nopib,
      d_tglpib:tglpib,
      d_importir:importir
    };
    return data;
  }
  return null;
}

//fungsi ini ngeformat tanggal yg udh ke format ke bentuk ddmmyy
function ddmmyy(tgl){
  if(tgl.length!=10)return '';
  var ret=tgl.substring(0,2);
  ret+=substring(3,2);
  ret+=substring(8,2);
  return ret;
}

//fungsi ini menghapus data yang diselect dari main table
//lalu mengurutkan ulang semua datanya
function tidy_main_table(){
  //hapus semua baris yang dipilih
  var selected=$('#main_source tbody input[type="checkbox"]:checked').closest('tr').remove();
  //ambil semua data
  var newdata=[];
  for(var i=0; i<$('#main_source tbody tr').length; i++){
    var data=get_data_pib(i);
    if(data)
     newdata.push({no_pib:data.d_nopib, tglpib:data.d_tglpib, importir:data.d_importir});
  }
  //now we clear data, and push back the data
  table_clear_data('main_source');
  table_insert_data('main_source', newdata);
}

//fungsi ini ngeklik tombol ok utk error yg ada pada tiap proses
function clear_error(){
  var ok=find_dom('button.z-button-os', 'OK', true);
  console.log('errors: '+ok)
  for(var i=0; i<ok.length; i++)
    ok[i].click();
}

//fungsi ini menjalankan redistribusi dokumen otomatis berdasarkan
//data utama
function proses_dok(){
  //selalu clear error
  clear_error();
  console.log('s:'+current_state+' id:'+current_id);
  //check dulu indexnya? klo slse brati slse
  if(current_id>=$('#main_source tbody > tr').length){
    alert('SLSEEEEEE');
    //reset state
    current_state=-1;
    current_id=0;
    $('#btn_pause').prop('disabled', true);
    return; //stop the process
  }
  //ambil data dulu
  var data=get_data_pib(current_id);
  if(data){
    //data buat ntar
    var inputs=$('.z-textbox');
    var dates=$('.z-datebox-inp');
    var buttons=$('span.z-button');
    
    //statusnya?
    switch(current_state){
      case 0: //0 means start. let's see if we can proceed
        {
          //if no input appears, break
          if(inputs.length <= 0 || dates.length <= 0 || buttons.length <= 0)break; //keep waiting
          
          //input no pib
          if(inputs.length>0){
            inputs[2].focus();
            inputs[2].value=data.d_nopib;
            inputs[2].blur();
          }
          console.log('got inputs '+inputs.length)
          
          //input tgl
          if(dates.length>0){
            dates[0].focus();
            dates[0].value=data.d_tglpib;
            dates[0].blur();
          }
          console.log('got dates '+dates.length)
          //alert(dates.length);
          //klik tombol cari
          var text=buttons[0].innerText || buttons[0].textContent;
          buttons[0].click();
          console.log('clicked '+text);
          
          //pindah ke status selanjutnya
          current_state=1;        
        }
        break;
      case 1: //check datanya ketemu apa kagak
        {
          //check for error
          var err=find_dom('span', 'Data Tidak Ditemukan');
          console.log('its '+err.length);
          if(err.length == 0){ //if error.length is zero
            //if(!ok)break;
            //ok.click();
            $('#main_source tbody > tr:nth-child('+(current_id+1)+')').addClass('passed');
            current_state=2;
          }else{
            //cari tombol ok
            var ok=find_dom('.z-button', 'OK');
            ok.click();
            console.log('found '+ok);
            $('#main_source tbody > tr:nth-child('+(current_id+1)+')').addClass('error');
            //karena error, loncatin aja ni dokumen
            current_state=10; //langsung lanjut ke dokumen laen
          }
        }
        break;
      case 2: //klik radio button 'manual'
        {
          //klik radio buttonnya
          var radios=$('input[type="radio"]');
          if(radios.length>1){
            if(radios[1].disabled) //blom bisa di klik
              break;
            radios[1].click();
            if(!inputs[13].disabled) //lanjut klo input boxny dh enabled
              current_state=3;
          }
        }
        break;
      case 3: //isi data PFPD tujuan
        {
          //tunggu sampe semua kondisi terpenuhi
          if(inputs.length<13)break;
          if(inputs[13].disabled)break;
          if(buttons.length<3)break;
          //start fillin
          inputs[13].focus();
          inputs[13].value=$('#sel_pfpd').val();
          inputs[13].blur();
          //clickin
          buttons[3].click(); //muncul form selanjutnya
          //change state
          current_state=4;
        }
        break;
      case 4:  //form surat ijin dll
        {
          var inputs=$('input.z-textbox');
          var buttons=$('span.z-button');
          var dates=$('input.z-datebox-inp');
          //kita sekarang di form ijin
          if(inputs.length<19)break;
          if(buttons.length<7)break;
          if(dates.length<2)break;
          
          inputs[17].focus();
          inputs[17].value=$('#s_perm').val(); //surat permohonan
          inputs[19].focus();
          inputs[19].value=$('#s_ijin').val(); //surat ijin
          
          dates[1].focus();
          dates[1].value=$('#tgl_s_perm').val();
          dates[1].blur();
          dates[2].focus();
          dates[2].value=$('#tgl_s_ijin').val();
          dates[2].blur();
          
          var alasan=$('textarea.z-textbox');
          if(alasan){
            alasan.focus();
            alasan.val('Dalam rangka mempercepat penyelesaian dokumen PIB jalur hijau');
            alasan.blur();
          }else
            break;
          //check for error
          if(dates[2].value.length==10 && dates[1].value.length==10)
            current_state=5;
          
          //current_id++; //move
          //current_state=0; //restart
        }
        break;
      case 5: //klik tombol search nip
        {
          var rbtns=$('i.z-bandbox-rounded-btn');
          if(rbtns.length>1){
            rbtns[1].click();
            current_state=6;
          }
        }
        break;
      case 6: //input nipnya
        {
          //input nip kepala kantor
          var inputs=$('input.z-textbox');
          if(inputs.length>20){
            inputs[inputs.length-1].focus();
            inputs[inputs.length-1].value=$('#bos_pfpd').val();
            pencet_tombol(inputs[inputs.length-1], 13);
            current_state=7;
          }
        }
        break;
      case 7: //klik nama kepala kantor
        {
          var li = $('tr.z-listitem');
          if(li.length > 0){
            li[0].click();
            current_state=8;
          }
        }
      case 8: //klik tombol keluar (TESTNG) (TODO: klik OK)
        {
          var simpan=find_dom('.z-button', 'Simpan');
          console.log(simpan);
          if(simpan){
            simpan.click();
            current_state=9;
          }
          //keluar.click();
          //current_state=9;
        }
        break;
      case 9: //klik tombol ok
        {
          var ok=find_dom('.z-button', 'OK', true);
          console.log('status 9: '+ok);
          if(ok.length>0){
            ok[0].click();
            current_state=10;
          }
        }
        break;
      case 10: //restart
        {
          current_id++;
          current_state=0;
        }
        break;
    }
    
    //oke, lanjut
    //$('#main_source tbody > tr:nth-child('+(current_id+1)+')').addClass('passed');
    //current_id++;
    //recurse
    timer=setTimeout(proses_dok, 200);
  }
}

//fungsi ini ngupdate flag berdasarkan checkboxes dalam tabel
function update_flag_based_on_table(src, tablename){
  var selected=$('#'+tablename+' tbody input[type="checkbox"]:checked');
  src.flags.length=0;
  src.flags=[]; //clear
  var txt='';
  for(var i=0; i<selected.length; i++){
    src.flags.push(selected[i].value);
  }
  //alert(txt);
}

//hapus data dari tabel
function table_clear_data(tablename){
  $('#'+tablename+' tbody tr').remove();
}

/*
var data_pib = {
  'no_dok' : no_pib,
  'jenis_dok' : jenis_dok,
  'pjt' : pjt,
  'consignee' : consignee,
  'alm_consignee' : alm_consignee,
  'cif' : cif,
  'tgl_hawb' : tgl_hawb,
  'curr_stats' : curr_stats
};
*/

//masukkin data ke tabel
function table_insert_data(tablename, data){
  var rows='';
  //must continue from last id (would be 0 if table is empty) 
  var lastid=$('#'+tablename+' tbody tr').length;
  //alert(lastid+' '+data.length);
  for(var i=0; i<data.length; i++){
    var row='<tr><td>'+(lastid+1)+'.</td><td class="editable">'
            +data[i].no_dok+'</td><td class="editable">'
            +data[i].jenis_dok+'</td><td>'
            +data[i].pjt+'</td><td>'
            +data[i].consignee+'</td><td>'
            +data[i].alm_consignee+'</td><td>'
            +data[i].cif+'</td><td>'
            +data[i].tgl_hawb+'</td><td>'
            +data[i].curr_stats+'</td><td><label><input type="checkbox" value="'
            +(lastid)+'">&nbsp;</label></td></tr>';
    rows+=row;
    lastid++;
  }
  $('#'+tablename+' tbody:last').append(rows);
}

//fungsi ini cari control
function cari_tombol(judul){
  var btns=$('button');
  for(var i=0; i<btns.length; i++){
    var text=btns[i].textContent || btns[i].innerText;
    if(text.search(judul)>=0){
      return btns[i];
    }
  }
  return null;
}

//klik tombol berdasarkan judul
function klik_tombol(judul){
  var cnt=0;
  var btns=$('button');
  for(var i=0; i<btns.length; i++){
    var text=btns[i].textContent || btns[i].innerText;
    if(text.search(judul)>=0){
      btns[i].click();
      cnt++;
    }
  }
  return cnt;
}

//klik link berdasarkan judul
function klik_link(judul){
  var cnt=0;
  var links=$('a.z-menu-item-cnt');
  for(var i=0; i<links.length; i++){
    var text=links[i].textContent || links[i].innerText;
    if(text.search(judul)>=0){
      links[i].click();
      cnt++;
    }
  }
  return cnt;
}

//fungsi ini nyari kontrol
function find_dom(type, title,retall){
  var q=$(type);
  var ret=[];
  for(var i=0; i<q.length; i++){
    var text=q[i].textContent || q[i].innerText;
    if(text){
      if(text.search(title)>=0){
        if(retall){
          ret.push(q[i]);
        }else{
          return q[i];
        }
      }
    }    
  }
  return ret;
}

//fungsi ini nyari kontrol
function pencet_tombol(control, code){
  var ev = document.createEvent('KeyboardEvent');
  ev.initKeyEvent('keydown', true, true, window, false, false, false, false, code, 0);
  control.dispatchEvent(ev);
}


//fungsi ini otomatis ngambil data dari ceisa
var pageLoaded = 0;
var csvData = [];

csvData.push([
  "no", "no_dok", "jns_aju", "pjt", "consignee",
  "alm_consignee", "CIF", "tgl_hawb", "curr_stats"
  ]);

/*
var data = $('.z-listcell');
var curr_page = $('.z-paging-input');
var total_page = $('.z-paging-text');

var btn_next = $('a.z-paging-next');
*/

function grab_data_cnpibk() {
  // grab data tentang halaman ke brp dari berapa
  var curr_page = $(".z-paging-input")[1].value;
  console.log(curr_page);

  // total halaman

  var total_page = /^\s+\/\s(\d+)$/.exec($(".z-paging-text")[1].innerText)[1];
  console.log(total_page);

  // convert text ke angka
  curr_page = parseInt(curr_page);
  total_page = parseInt(total_page);

  // tombol yg di klik utk masuk tahap berikutnya
  var btn_next = $("a.z-paging-next")[1];
  console.log(btn_next);

  if ( (curr_page <= total_page) && (curr_page > pageLoaded)) {
    pageLoaded = curr_page;
    //di sini kita mulai ambil data yg muncul
    var data=$(".z-listcell");
    console.log(data);

    var grabbed_data = [];

    if (data.length > 0) {
      console.log("Di halaman ini ada " + data.length/8 + " row data");

      for (var i=0; i<data.length/8; i++) {
        var no_dok = data[i*8+0].innerText;
        var jenis_dok = data[i*8+1].innerText;
        var pjt = data[i*8+2].innerText;
        var consignee = data[i*8+3].innerText;
        var alm_consignee = data[i*8+4].innerText;
        var cif = data[i*8+5].innerText;
        var tgl_hawb = data[i*8+6].innerText;
        var curr_stats = data[i*8+7].innerText;

        var data_pib = {
          'no_dok' : no_dok,
          'jenis_dok' : jenis_dok,
          'pjt' : pjt,
          'consignee' : consignee,
          'alm_consignee' : alm_consignee,
          'cif' : cif,
          'tgl_hawb' : tgl_hawb,
          'curr_stats' : curr_stats
        };

        csvData.push([
          csvData.length, no_dok, jenis_dok, pjt, consignee,
          alm_consignee, cif, tgl_hawb, curr_stats
          ]);

        grabbed_data.push(data_pib);
        console.log(data_pib);
        // console.log(data[i*13+0]);
      }

      table_insert_data("main_source", grabbed_data);
    }
    // klik tombol next
    if (curr_page != total_page) {
      btn_next.click();
      // tunggu 2 detik biar gk miss
      setTimeout(grab_data_cnpibk, 2000);  
    } else {
      alert("grabbing ended!");

      let csvContent = "data:text/csv;charset=utf-8";
      csvData.forEach(function(rowData) {
        let row = rowData.join(",");
        csvContent += row + "\n";
      });

      var encodedURI = encodeURI(csvContent);

      var link = document.createElement("a");
      link.setAttribute("href", encodedURI);
      link.setAttribute("download", "grabbed.csv");
      link.text = "Save CSV";

      $("#csv_download").html('');
      $("#csv_download").append(link);
    }
    
  } else {
    console.log("Data load takes too long...restarting");
    setTimeout(grab_data_cnpibk, 5000);
  }
  
}

//==========================================================================


$(document).ready(function(){
  //bunch of handlers
  $(document).on('change', '#sel_pfpd', function(){
    $('#i_nip_pfpd').val($('#sel_pfpd').val());
  });
  //editable handler
  $(document).on('dblclick', '.editable', function(){
    //alert($(this).html());
    var newval=prompt('Masukin nilai baru: ', $(this).html());
    if(newval)
      $(this).html(newval);
  });
  //format tanggal
  $(document).on('blur', '.datebox', function(){
    var value=$(this).val();
    //skip if it doesnt have six length
    if(value.length!=6)return;
    value=value.trim();
    var tgl=value.substr(0, 2);
    var bln=value.substr(2, 2);
    var thn=value.substr(4, 2);
    //var today=new Date();
    var realyear=2000+parseInt(thn);
    $(this).val(tgl+'-'+bln+'-'+realyear);
  });
  //klo dapet focus, format balik
  $(document).on('focus', '.datebox', function(){
    var value=$(this).val();
    value=value.trim();
    if(value && value.length>=10){
      //revert
      var tgl=value.substr(0, 2);
      var bln=value.substr(3, 2);
      var thn=value.substr(6, 4);
      thn=thn-2000;
      value=String(tgl)+String(bln)+String(thn);
      $(this).val(value);
    }
  });
  //button handler
  $(document).on('click', 'button, input[type="checkbox"]', function(){
    switch($(this).attr('id')){
      case 'ms_sel_all':
      case 'gd_sel_all':
        {
          $(this).closest('table').find('tbody input[type="checkbox"]').prop('checked', $(this).is(':checked'));
        }
        break;
      case 'btn_showpanel':
        $('#bowoxers').show();
        $('#btncontrol').hide();
        break;
      case 'btn_hidepanel':
        $('#bowoxers').hide();
        $('#btncontrol').show();
        break;
      case 'btn_clear_selected':
        tidy_main_table();
        break;
      case 'btn_clear_source':
        table_clear_data('main_source');
        break;
      case 'btn_pause':
        {
          var text=$(this).html();
          if(text=="PAUSE"){
            //klik pause
            clearTimeout(timer);
            timer=null;
            //set to resume
            $(this).html('RESUME');
          }else{
            //check klo masih ada timer
            if(timer){
              alert('Sorry, ada proses yg masih jalan!');
              break;
            }
            //klik resume. back to pause
            $(this).html('PAUSE');
            proses_dok();
          }
        }
        break;
      case 'btn_add_data':
        //let's print all stuffs we have
        {
          var txt='';
          //sort the array
          //alert(add_data_pfpd.flags.length);
          update_flag_based_on_table(add_data_pfpd, 'tbl_pib');
          //alert(add_data_pfpd.flags.length);
          add_data_pfpd.flags.sort(function(a,b){return a-b;});
          /*for(var i=0; i<add_data_pfpd.flags.length; i++)
            txt+=add_data_pfpd.flags[i]+' ';
          alert(txt);*/
          //now prepare real data input
          var data=[];
          for(var i=0; i<add_data_pfpd.flags.length; i++){
            //insert
            data.push(add_data_pfpd.data[add_data_pfpd.flags[i]]);
          }
          //close this form (optional:clear remaining data)
          $('#grabdata').hide();
          table_clear_data('tbl_pib');
          add_data_pfpd.data=null; //clear it
          //insert to next table, then close this form
          table_insert_data('main_source', data); //insert to main table
        }
        break;
      case 'btn_mulai':
        {
          //$('#main_source tr:nth-child(10)').addClass('passed');
          //enable pause
          $('#btn_pause').prop('disabled', false);
          //check status
          /*if(current_state<0){
            klik_tombol('Kepala Kantor');
            setTimeout(function(){
              pencet_tombol(document.activeElement, 40); //down
              pencet_tombol(document.activeElement, 40); //down
              pencet_tombol(document.activeElement, 39); //right
              pencet_tombol(document.activeElement, 40); //down
              pencet_tombol(document.activeElement, 40); //down --- karena menunya turun satu elemen :p
              pencet_tombol(document.activeElement, 13); //enter
              //statusnya 0 artinya bisa mulai proses dokumen
              current_state=0;
              //mulai dari 0
              current_id=0;
              //panggil proses dok
              proses_dok();
            }, 1000);
          }*/
          alert("grabbing started...");

          $("#csv_download").html('');

          pageLoaded = 0;
          csvData = [];
          csvData.push([
          "no", "no_dok", "jns_aju", "pjt", "consignee",
          "alm_consignee", "CIF", "tgl_hawb", "curr_stats"
          ]);
          // grab_data_pib();
          grab_data_cnpibk();

          // var data = $('.z-listcell');
          // var curr_page = $('.z-paging-input');
          // var total_page = $('.z-paging-text');

          // var btn_next = $('a.z-paging-next');

          // console.log(btn_next);

          // console.log(data);
          // console.log(curr_page);
          // console.log(total_page);

          // btn_next[1].click();
        }
        break;
      case 'btn_tambah_data':
        $('#grabdata').show();
        break;
      case 'btn_close':
        $('#grabdata').hide();
        break;
      case 'btn_query':{
        var nip_pfpd=$('#sel_dok_pfpd').val();
        var tgl_tt=$('#tgl_tanter').val();
        if(!nip_pfpd){
          alert("isi nip pfpd dulu dong");
          return;
        }
        if(!tgl_tt){
          alert('isi tgl tanda terima dulu dong');
          return;
        }
        var to_url=encodeURI("http://192.168.146.58/autoredist.pc/get_data.php?"+'nip_pfpd='+nip_pfpd+'&tgl_tt='+tgl_tt);
        //should show loading progress...
        var orig_text='Ambil Data';
        
        //alert(to_url);
        
        var me=$(this);
        me.html('loading...');
        //me.prop('disabled',true);
        $('#btn_add_data').prop('disabled',true);
        GM_xmlhttpRequest({
          method: "GET",
          url: to_url,
      timeout: 7000,
          onload: function(response){
            var data=JSON.parse(response.responseText);
            //alert(data.length);
            me.prop('disabled', false);
            me.html(orig_text);
            $('#btn_add_data').prop('disabled', false);
            table_clear_data('tbl_pib');
            table_insert_data('tbl_pib', data);
            add_data_pfpd.data=data;
            add_data_pfpd.flags=[];
          },
          onerror: function(response){
            alert('error '+response);
            me.prop('disabled', false);
            me.html(orig_text);
            $('#btn_add_data').prop('disabled', false);
          },
          ontimeout: function(response){
            alert('timeout '+response);
            me.prop('disabled', false);
            me.html(orig_text);
            $('#btn_add_data').prop('disabled', false);
          }
        });
        /*$.ajax({
          url:to_url,
          async:true,
          success:function(result){
            me.prop('disabled',false);
            me.html(orig_text);
            $('#btn_add_data').prop('disabled',false);
            //clear table
            table_clear_data('tbl_pib');
            //great now we append all to table
            var data=JSON.parse(result);
            add_data_pfpd.data=data; //copy it heheh
            add_data_pfpd.flags=[]; //clear the flags;
            //insert to table
            table_insert_data('tbl_pib', data);
          },
          error:function(a,b,c){
            alert('error while fetching data :p ('+a+b+c+')');
            me.prop('disabled',false);
            me.html(orig_text);
            $('#btn_add_data').prop('disabled',false);
          }
        });*/
      }
        break;
    }
  });
  
  var home=$('div#bowoxers');
  
  //==========================ENTRY POINT===============================================================================================
  if(!home.exists()){
    var contents=GM_getResourceText('homepagev1');
    //alert(contents);
    $('body.gecko').append(contents);
  }  
});
