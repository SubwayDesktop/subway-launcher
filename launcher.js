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
var categories = {};
var entry_lists = {};
var current_category = '';


var tile_container, categories_group, desktop_group, button;


function gen_app_list(dir){
    var files = fs.list(dir);
    for(let file of files){
	let path = dir + '/' + file;
	if(fs.isDir(file)){
	    gen_app_list(path);
	}else if(file.match(/\.desktop$/)){
	    let data = xdg.loadDesktopFile(path);
	    if(!data.no_display && data.type == 'application')
		apps.push(data);
	}
    }
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


function gen_entry_list(arr){
    var entry_container = create('div', {
	className: 'entry_container'
    });
    for(let app of arr){
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
    var leftover_categories = [];
    var leftover_apps = [];
    for(let I of Object.keys(categories)){
	if(Object.keys(CATEGORIES).indexOf(I) != -1){
	    for(let app of categories[I])
		classified.add(app);
	    entry_lists[I] = gen_entry_list(categories[I]);
	}else{
	    leftover_categories.push(I);
	}
    }
    for(let I of leftover_categories)
	for(let app of categories[I])
	    if(!classified.has(app))
		leftover_apps.push(app);
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
	    className: 'category_icon'
	});
	let icon_name = 'preferences-other';
	if(category != 'Others')
	    icon_name = CATEGORIES[category].icon;
	let icon = xdg.getIcon(icon_name);
	if(icon)
	    icon.assignToHTMLImageElement(category_icon)
	let category_label = create('div', {
	    className: 'category_label',
	    textContent: name
	});
	let category_tile = create('div', {
	    classList: ['tile', 'category_tile'],
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
	process.execDetached(this.dataset.exec.replace(/ *%./g, ''));
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
    gen_app_list(APPLICATIONS);
    gen_categories();
    gen_entry_lists();
    gen_categories_list();
    button.addEventListener('click', handle_button_click);
}


window.addEventListener('load', init);
