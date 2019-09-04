// ==UserScript==
// @name        ceisa_inject
// @namespace   my_testcase
// @description To inject control form for doc redistribution
// @include     *
// @version     1
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       unsafeWindow
// @grant       GM_xmlhttpRequest
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @resource    homepagev22  http://192.168.146.250/autograbber/home.php
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
          if(inputs.length <= 0 || dates.length <= 0 || buttons.length <= 0) {
          	console.log("Page not loading correctly? "+inputs.length + " : " + dates.length + " : " + buttons.length);
          	break; //keep waiting
          }
          
          //input no pib
          if(inputs.length>0){
            inputs[2].focus();
            inputs[2].value=data.d_nopib;
            inputs[2].blur();
          }
          console.log('got inputs '+inputs.length);
          
          //input tgl
          if(dates.length>0){
            dates[0].focus();
            dates[0].value=data.d_tglpib;
            dates[0].blur();
          }
          console.log('got dates '+dates.length);
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

//masukkin data ke tabel
function table_insert_data(tablename, data){
  var rows='';
  //must continue from last id (would be 0 if table is empty) 
  var lastid=$('#'+tablename+' tbody tr').length;
  //alert(lastid+' '+data.length);
  for(var i=0; i<data.length; i++){
    var row='<tr><td>'+(lastid+1)+'.</td><td class="editable">'+data[i].no_pib+'</td><td class="editable">'+data[i].tglpib+'</td><td>'+data[i].importir+'</td><td><label><input type="checkbox" value="'+(lastid)+'">&nbsp;</label></td></tr>';
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
  ev.initKeyEvent('keydown', true, true, unsafeWindow, false, false, false, false, code, 0);
  control.dispatchEvent(ev);
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

  //tambah entry
  $(document).on('click', '#btn_tambah_baris', function() {
  	var no_pib=prompt('Masukan no pib (6 digit): ', '');
  	if (no_pib) {
  		var tgl_pib=prompt('Masukan tgl pib (ddmmyy): ', '');
  		if (tgl_pib) {
  			var lastid=$('#main_source'+' tbody tr').length;
			var row='<tr><td>'+(lastid+1)+'.</td><td class="editable">'+no_pib+'</td><td class="editable">'+tgl_pib+'</td><td>'+'<ANON>'+'</td><td><label><input type="checkbox" value="'+(lastid)+'">&nbsp;</label></td></tr>'; 
			$('#main_source'+' tbody:last').append(row);
  		}
  	}
  });

  //format tanggal
  $(document).on('blur', '.datebox', function(){
    /*var value=$(this).val();
    //skip if it doesnt have six length
    if(value.length!=6)return;
    value=value.trim();
    var tgl=value.substr(0, 2);
    var bln=value.substr(2, 2);
    var thn=value.substr(4, 2);
    //var today=new Date();
    var realyear=2000+parseInt(thn);
    $(this).val(tgl+'-'+bln+'-'+realyear);*/
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
          if(current_state<0){
            klik_tombol('Kepala Kantor');
            setTimeout(function(){
              pencet_tombol(document.activeElement, 40); //down
              pencet_tombol(document.activeElement, 40); //down
              pencet_tombol(document.activeElement, 39); //right
              pencet_tombol(document.activeElement, 40); //down
              pencet_tombol(document.activeElement, 40); //down --- karena menunya turun satu elemen :p
              pencet_tombol(document.activeElement, 13); //enter
              console.log("Mulai");
              //statusnya 0 artinya bisa mulai proses dokumen
              current_state=0;
              //mulai dari 0
              current_id=0;
              //panggil proses dok
              proses_dok();
            }, 1000);
          }
          //here we spawn docproc process
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
    var contents=GM_getResourceText('homepagev22');
    //alert(contents);
    $('body.gecko').append(contents);
  }  
});