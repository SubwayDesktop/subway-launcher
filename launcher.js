/* Subway Launcher */

(() => console.log('Hello World'))();


const ICON_SIZE = 64;
const APPLICATIONS = '/usr/share/applications';
const SEARCH_CATE = 'SearchResult';
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
var wheel_mode = 'scroll';


var tile_container, categories_group, desktop_group, go_back_button, search_box;


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


function gen_app_list(dir) {
    var applications = [];
    var files = fs.list(dir);
    for(let file of files) {
	let path = dir + '/' + file;
	if(fs.isDir(file)){
	    gen_app_list(path);
	} else if(file.match(/\.desktop$/)) {
	    let data = xdg.loadDesktopFile(path);
	    if(!data.no_display && data.type == 'application')
		applications.push(data);
	}
    }
    return applications;
}


function gen_categories() {
    for(let app of apps) {
	for(let I of app.categories) {
	    if(categories[I])
		categories[I].push(app);
	    else
		categories[I] = [app];
	}
    }
}


function gen_entry_list(iterable) {
    var entry_container = create('div', {
	className: 'entry_container'
    });
    for(let app of iterable) {
	let icon = create('img', {
	    className: 'entry_icon'
	});
	if(app.icon)
	    app.icon.assignToHTMLImageElement(icon);
	let label = create('span', {
	    className: 'entry_label',
	    textContent: app.name
	});
	let wrapper = create('div', {
	    className: 'entry_content_wrapper',
	    children: [
		icon,
		label
	    ]
	});
	let entry = create('div', {
	    className: 'entry_tile',
	    dataset: {
		exec: app.exec
	    },
	    children: [
		wrapper
	    ]
	});
	entry.addEventListener('click', handle_entry_click);
	entry_container.appendChild(entry);		
    }
    hide(entry_container);
    entry_container.addEventListener('webkitAnimationEnd',
				     handle_animation_end);
    return entry_container;
}


function gen_entry_lists() {
    var instance, icon, text, exec;
    var classified = new Set();
    var leftover_categories = new Set();
    var leftover_apps = new Set();
    for(let I of Object.keys(categories)) {
	if(Object.keys(CATEGORIES).indexOf(I) != -1) {
	    for(let app of categories[I])
		classified.add(app);
	    entry_lists[I] = gen_entry_list(categories[I]);
	} else {
	    leftover_categories.add(I);
	}
    }
    for(let I of leftover_categories)
	for(let app of categories[I])
	    if(!classified.has(app))
		leftover_apps.add(app);
    entry_lists['Others'] = gen_entry_list(leftover_apps);
    entry_lists[SEARCH_CATE] = gen_entry_list((function* (){})());
    for(let I of Object.keys(entry_lists)) {
	document.body.appendChild(entry_lists[I]);
    }
}


function search_text(text) {
    function* get_filtered_apps(match) {
	for(let I of apps) {
	    if(match(I))
		yield I;
	}
    }
    function match(app) {
	var keys = ['name', 'exec', 'comment'];
	for(let I of keys) {
	    if(app[I].toLowerCase().indexOf(text.toLowerCase()) != -1)
		return true;
	}
	return false;
    }
    document.body.removeChild(entry_lists[SEARCH_CATE]);
    entry_lists[SEARCH_CATE] = gen_entry_list(get_filtered_apps(match));
    document.body.appendChild(entry_lists[SEARCH_CATE]);
    switch_to_category(SEARCH_CATE);
}


function gen_categories_list() {
    for(let category of Object.keys(entry_lists)) {
	let name = category;
	if(name == SEARCH_CATE) {
	    continue;
	}
	if(name != 'Others') {
	    name = CATEGORIES[category].display_name || category;
	}
	let category_icon = create('img', {
	    classList: ['tile_icon', 'category_icon']
	});
	let icon_name = 'preferences-other';
	if(category != 'Others')
	    icon_name = CATEGORIES[category].icon;
	else
	    icon_name = 'applications-other';
	let icon = xdg.getIcon(icon_name);
	let icon_background = '';
	if(icon) {
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


function gen_desktop_tiles() {
    for(let app of desktop_apps) {
	let desktop_app_icon = create('img', {
	    classList: ['tile_icon', 'desktop_app_icon']
	});
	let icon_background = '';
	if(app.icon) {
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


function switch_to_category(category) {
    if(current_category == '') {
	hide(tile_container);
    } else {
	hide(entry_lists[current_category]);
    }
    show(entry_lists[category]);
    entry_lists[category].style.webkitAnimationPlayState = 'running';
    current_category = category;
}


function switch_to_home() {
    if(current_category != '') {
	hide(entry_lists[current_category]);
    }
    show(tile_container);
    tile_container.style.webkitAnimationPlayState = 'running';
    current_category = '';
    search_box.value = '';
}


function show_search_result() {
    switch_to_category(SEARCH_CATE);
}


function handle_category_click() {
    switch_to_category(this.dataset.category);
}


function handle_go_back_button_click() {
    if(current_category != ''){
	switch_to_home();
    } else {
	GUI.visible = false;
    }
}


function handle_entry_click() {
    if(this.dataset.exec) {
	let exec = this.dataset.exec.replace(/ *%./g, '');
	let args = exec.split(' ');
	let cmd = args.shift();
	process.execDetached(
	    cmd,
	    args,
	    process.getEnv('HOME')
	);
	GUI.visible = false;
	switch_to_home();
    }
}


function handle_document_keyup(ev) {
    if(ev.keyCode == 27) {
	/* Escape Key */
	handle_go_back_button_click();
    } else if(search_box != document.activeElement) {
	search_box.focus();
    }
}


function handle_search_box_keyup(ev) {
    var text = this.value;
    if(ev.keyCode == 13) {
	/* Enter Key */
	if(current_category == SEARCH_CATE) {
	    let list = entry_lists[SEARCH_CATE];
	    if(list.firstElementChild)
		handle_entry_click.call(list.firstElementChild);
	}
    } else if(ev.keyCode != 27) {
	if(text)
	    search_text(text);
	else
	    switch_to_home();
    }
}


function handle_mousewheel_event(ev) {
    /* intervene manually */
    window.scrollBy(-ev.wheelDelta);
}


function handle_animation_end() {
    this.style.webkitAnimationPlayState = 'paused';
}


function load_user_style() {
    var file = xdg.userDirs.config + '/subway/launcher/user_style.css';
    if(fs.exists(file) && !fs.isDir(file)){
	let tag = create('link', {
	    rel: 'stylesheet',
	    href: file
	});
	document.head.appendChild(tag);
    }
}


function init() {
    assignGlobalObjects({
	tile_container: '#tile_container',
	categories_group: '#categories_group',
	desktop_group: '#desktop_group',
	go_back_button: '#go_back_button',
	search_box: '#search_box',
	toggle_mode_button: '#toggle_mode_button'
    });
    xdg.iconSize = ICON_SIZE;
    apps = gen_app_list(APPLICATIONS);
    desktop_apps = gen_app_list(xdg.userDirs.desktop);
    gen_categories();
    gen_entry_lists();
    gen_categories_list();
    gen_desktop_tiles();
    go_back_button.addEventListener('click', handle_go_back_button_click);
    search_box.addEventListener('keyup', handle_search_box_keyup);
    document.addEventListener('keyup', handle_document_keyup);
    window.addEventListener('mousewheel', handle_mousewheel_event);
    tile_container.addEventListener('webkitAnimationEnd',
				    handle_animation_end);
    document.body.style.fontSize = 0.35 * (
	screen.height/42 + screen.height/38.4) + 'px';
    load_user_style();

//    search_box.focus();
    search_box.addEventListener('blur', function(){ this.focus(); });
}


window.addEventListener('load', init);
