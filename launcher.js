/* Subway Launcher */


const ICON_SIZE = 64;
const APPLICATIONS = '/usr/share/applications';
const CATEGORIES = {
    'Accessibility': {
	icon: 'applications-accessories'
    },
    'AudioVideo': {
	display_name: 'Multimedia',
	icon: 'applications-multimedia'
    },
    'Development': {
	icon: 'applications-development'
    },
    'Education': {
	icon: 'applications-science'
    },
    'Game': {
	icon: 'applications-games'
    },
    'Graphics': {
	icon: 'applications-graphics'
    },
    'Network': {
	display_name: 'Internet',
	icon: 'applications-internet'
    },
    'Office': {
	icon: 'applications-office'
    },
    'Settings': {
	icon: 'preferences-other'
    },
    'System': {
	icon: 'preferences-system'
    },
    'Utility': {
	icon: 'applications-utilities'
    }
};


var process = Modules.load('Process');
var fs = Modules.load('FileSystem');
var xdg = Modules.load('Xdg');


var apps = [];
var desktop_apps = [];
var categories = {};
var entry_lists = {};
var current_category = '';


var tile_container, categories_group, desktop_group, button;


/*
function get_icon_background(icon){
    let data = icon.toImageData().data;
    let points = [];
    for(let i=0; i<data.length;  i+=4)
	points.push([data[i], data[i+1], data[i+2]]);
    let km = new kMeans({K: 3});
    let colors = km.cluster(points);
    let color = '#';
    let gradient_color = '#';
    for(let i=0; i<2; i++)
	if(colors[0][0] == 0 && colors[0][1] == 0 && colors[0][2] == 0)
	    colors.shift();
    for(let i=0; i<3; i++){
	let value = colors[0][i];
	let new_value = value;
	if(new_value < 240)
	    new_value += 15;
	else
	    new_value -= 15;
	let str = value.toString(16);
	if(str.length < 2) str = '0' + str;
	color += str;
	str = new_value.toString(16);
	if(str.length < 2) str = '0' + str;
	gradient_color += str;
    }
    return printf('linear-gradient(to bottom, %1 0%,%2 100%)', color, gradient_color);
}
*/


function gen_app_list(dir){
    var applications = [];
    var files = fs.list(dir);
    for(let file of files){
	let path = dir + '/' + file;
	if(fs.isDir(file)){
	    gen_app_list(path);
	}else if(file.match(/\.desktop$/)){
	    let data = xdg.loadDesktopFile(path);
	    if(!data.no_display && data.type == 'application')
		applications.push(data);
	}
    }
    return applications;
}


function gen_categories(){
    for(let app of apps){
	for(let I of app.categories){
	    if(categories[I])
		categories[I].push(app);
	    else
		categories[I] = [app];
	}
    }
}


function gen_entry_list(iterable){
    var entry_container = create('div', {
	className: 'entry_container'
    });
    for(let app of iterable){
	let icon = create('img', {
	    className: 'entry_icon'
	});
	if(app.icon)
	    app.icon.assignToHTMLImageElement(icon);
	let separator = create('span', {
	    className: 'entry_separator'
	});
	let label = create('span', {
	    className: 'entry_label',
	    textContent: app.name
	});
	let entry = create('div', {
	    className: 'entry_tile',
	    dataset: {
		exec: app.exec
	    },
	    children: [
		icon,
		separator,
		label
	    ]
	});
	entry.addEventListener('click', handle_entry_click);
	entry_container.appendChild(entry);		
    }
    hide(entry_container);
    return entry_container;
}


function gen_entry_lists(){
    var instance, icon, text, exec;
    var classified = new Set();
    var leftover_categories = new Set();
    var leftover_apps = new Set();
    for(let I of Object.keys(categories)){
	if(Object.keys(CATEGORIES).indexOf(I) != -1){
	    for(let app of categories[I])
		classified.add(app);
	    entry_lists[I] = gen_entry_list(categories[I]);
	}else{
	    leftover_categories.add(I);
	}
    }
    for(let I of leftover_categories)
	for(let app of categories[I])
	    if(!classified.has(app))
		leftover_apps.add(app);
    entry_lists['Others'] = gen_entry_list(leftover_apps);
    for(let I of Object.keys(entry_lists))
	document.body.appendChild(entry_lists[I]);
}


function gen_categories_list(){
    for(let category of Object.keys(entry_lists)){
	let name = category;
	if(name != 'Others')
	    name = CATEGORIES[category].display_name || category;
	let category_icon = create('img', {
	    classList: ['tile_icon', 'category_icon']
	});
	let icon_name = 'preferences-other';
	if(category != 'Others')
	    icon_name = CATEGORIES[category].icon;
	let icon = xdg.getIcon(icon_name);
	let icon_background = '';
	if(icon){
	    // icon_background = get_icon_background(icon);
	    icon.assignToHTMLImageElement(category_icon);
	}
	let category_label = create('div', {
	    classList: ['tile_label', 'category_label'],
	    textContent: name
	});
	let category_tile = create('div', {
	    classList: ['tile', 'category_tile'],
	    style: {
		background: icon_background
	    },
	    dataset: {
		category: category
	    },
	    children: [
		category_icon,
		category_label
	    ]
	});
	category_tile.addEventListener('click', handle_category_click);
	categories_group.appendChild(category_tile);
    }
}


function gen_desktop_tiles(){
    for(let app of desktop_apps){
	let desktop_app_icon = create('img', {
	    classList: ['tile_icon', 'desktop_app_icon']
	});
	let icon_background = '';
	if(app.icon){
	    // icon_background = get_icon_background(app.icon);
	    app.icon.assignToHTMLImageElement(desktop_app_icon);
	}
	let desktop_app_label = create('div', {
	    classList: ['tile_label', 'desktop_app_label'],
	    textContent: app.name
	});
	let desktop_app_tile = create('div', {
	    classList: ['tile', 'desktop_app_tile'],
	    style: {
		background: icon_background
	    },
	    dataset: {
		exec: app.exec
	    },
	    children: [
		desktop_app_icon,
		desktop_app_label
	    ]
	});
	// Use the same event handler function as entries
	desktop_app_tile.addEventListener('click', handle_entry_click);
	desktop_group.appendChild(desktop_app_tile);
    }
}


function handle_category_click(){
    var category = this.dataset.category;
    hide(tile_container);
    show(entry_lists[category]);
    current_category = category;
}


function handle_button_click(){
    if(current_category){
	hide(entry_lists[current_category]);
	show(tile_container);
	current_category = '';
    }else{
	GUI.visible = false;
    }
}


function handle_entry_click(){
    if(this.dataset.exec){
	process.execDetached(
	    this.dataset.exec.replace(/ *%./g, ''),
	    [],
	    process.getEnv('HOME')
	);
	GUI.visible = false;
	handle_button_click();
    }
}


function init(){
    assignGlobalObjects({
	tile_container: '#tile_container',
	categories_group: '#categories_group',
	desktop_group: '#desktop_group',
	button: '#button'
    });
    xdg.iconSize = ICON_SIZE;
    apps = gen_app_list(APPLICATIONS);
    desktop_apps = gen_app_list(xdg.userDirs.desktop);
    gen_categories();
    gen_entry_lists();
    gen_categories_list();
    gen_desktop_tiles();
    button.addEventListener('click', handle_button_click);
}


window.addEventListener('load', init);
