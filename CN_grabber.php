<style>
#bowoxers, #tai{
	position: fixed;
	top: 5%;
	left: 15%;
	width: 70%;
	height: 25%;
	padding: 10px;
	border-radius: 5px;
	box-shadow: 1px 1px 4px rgba(0,0,0,0.6);
	
	background: rgba(0,0,0,0.75);
	color: #fff;
	
	z-index: 999;
	overflow: auto;
	
	display: none;
}
#tai{
	position:fixed;
	top:35%;
	height:55%;
	display:inherit;
}
#s_perm, #s_ijin{
	width: 300px;
}

#btncontrol{
	position:fixed;
	z-index:1991;
	top:0;
	left:10px;
}

#grabdata{
	z-index: 1000;
	background: rgba(0,0,0,0.75);
	color: #fff;
	overflow: auto;
	position: fixed;
	top: 5%;
	left: 25%;
	width: 50%;
	height: 90%;
	
	padding: 10px;
	border-radius: 5px;
	box-shadow: 1px 1px 4px rgba(0,0,0,0.6);
	
	display:none;
}

.baris{
	margin: 4px auto;
}

.btable{
	margin: 0 auto;
	border-collapse:collapse;
	font-family: Arial;
	color: #fff;
	text-shadow: 1px 1px 4px rgba(255,255,255,0.7);
}

.btable th, .btable td{
	padding: 2px 4px;
	border: 1px solid #fff;
}

tr.passed{
	color: #0f0;
	text-shadow: 1px 1px 4px rgba(0, 255, 0, 0.7);
}

tr.error{
	color: #f00;
	text-shadow: 1px 1px 4px rgba(255, 0, 0, 0.7);
}

.btable label{
	user-select: none;
	-moz-user-select: none;
	-webkit-user-select: none;
	
	height: 100%;
	width: 100%;
	display: block;
}
</style>

<div id="btncontrol">
	<button id="btn_showpanel" type="button">Buka Panel</button>
</div>

<div id="bowoxers">
	
	
	<div class="baris">
		<span>Tanggal dari: </span>
		<input id="tgl_awal" class="datebox" type="text" maxlength="10">
		<span>s/d</span>
		<input id="tgl_akhir" class="datebox" type="text" maxlength="10">
		<button id="btn_hidepanel" type="button">Sembunyikan</button>
	</div>
	
	<div class="baris" style="text-align:center;">
		<button id="btn_mulai" type="button"><b>MULAI</b></button>
		<button id="btn_tambah_data" type="button">TAMBAH DATA</button>
		<button id="btn_clear_source" type="button">HAPUS SEMUA</button>
		<button id="btn_clear_selected" type="button">HAPUS</button>
		<button id="btn_pause" type="button" disabled>PAUSE</button>
		<div id="csv_download"></div>
	</div>
	<div id="tai" class="baris" style="text-align:center;">
		<table id="main_source" class="btable">
			<thead>
				<th>No.</th>
				<th>No CN/PIBK</th>
				<th>Jenis AJU</th>
				<th>Nama Pemberitahu</th>
				<th>Nama Penerima</th>
				<th>Alamat Penerima</th>
				<th>CIF</th>
				<th>Tgl HAWB</th>
				<th>Current Status</th>
				<th><label><input type="checkbox" id="ms_sel_all">&nbsp;</label></th>
			</thead>
			<tbody>
			</tbody>
		</table>
	</div>
</div>

<div id="grabdata">
	<div class="baris">
	<table id="tbl_pib" class="btable">
		<thead>
			<th>No.</th>
			<th>No CN/PIBK</th>
			<th>Jenis AJU</th>
			<th>Nama Pemberitahu</th>
			<th>Nama Penerima</th>
			<th>Alamat Penerima</th>
			<th>CIF</th>
			<th>Tgl HAWB</th>
			<th>Current Status</th>
			<th><label><input type="checkbox" id="gd_sel_all">&nbsp;</label></th>
		</thead>
		<tbody>
		</tbody>
	</table>
	</div>
	<div class="baris" style="text-align:center;">
		<button id="btn_add_data" type="button">Tambah</button>
	</div>
</div>
