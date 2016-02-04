/* Subway Launcher */


const ICON_SIZE = 64;
const APPLICATIONS = '/usr/share/applications';
const CATEGORIES = [
    'Accessibility',
    'Development',
    'Education',
    'Graphics',
    'Network',
    'Office',
    'Settings',
    'System',
    'Utility',
];


var process = Modules.load('Process');
var fs = Modules.load('FileSystem');
var xdg = Modules.load('Xdg');


var apps = [];
var categories = {};
var entry_lists = {};


var categories_group, desktop_group;


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
    var leftover = [];
    for(let I of Object.keys(categories)){
	if(CATEGORIES.indexOf(I) != -1)
	    entry_lists[I] = gen_entry_list(categories[I]);
	else
	    Array.prototype.push.apply(leftover, categories[I]);
    }
    entry_lists['Others'] = gen_entry_list(leftover);
    for(let I of Object.keys(entry_lists))
	document.body.appendChild(entry_lists[I]);
}


function gen_categories_list(){
    for(let category of Object.keys(entry_lists)){
	let category_tile = create('div', {
	    classList: ['tile', 'category_tile'],
	    textContent: category,
	    dataset: {
		category: category
	    }
	});
	category_tile.addEventListener('click', handle_category_click);
	categories_group.appendChild(category_tile);
    }
}


function handle_category_click(){
    hide(tile_container);
    show(entry_lists[this.dataset.category]);
}


function handle_entry_click(){
    if(this.dataset.exec)
	process.execDetached(this.dataset.exec.replace(/ *%./g, ''));
}


function init(){
    assignGlobalObjects({
	tile_container: '#tile_container',
	categories_group: '#categories_group',
	desktop_group: '#desktop_group'	
    });
    xdg.iconSize = ICON_SIZE;
    gen_app_list(APPLICATIONS);
    gen_categories();
    gen_entry_lists();
    gen_categories_list();
}


window.addEventListener('load', init);
