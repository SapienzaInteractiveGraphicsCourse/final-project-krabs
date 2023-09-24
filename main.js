// THREE.js 
import * as THREE from './three/three.module.min.js';
import { OrbitControls } from './three/OrbitControls.js';
import { TextGeometry } from './three/TextGeometry.js';
import { FontLoader } from './three/FontLoader.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { TransformControls } from './three/TransformControls.js';
import { CCDIKSolver } from '/three/CCDIKSolver.js';
import Stats from './three/stats.module.js';
// TWEEN.js
import TWEEN from './tween/tween.esm.js';

// Make it so that, on any error, a <div> is added to the page with the error message, in the top-middle of the page
function on_error(error) {
	let error_div = document.createElement("div");
	error_div.style.position = "absolute";
	error_div.style.top = "0";
	error_div.style.left = "0";
	error_div.style.right = "0";
	error_div.style.backgroundColor = " #ff0000dd";
	error_div.style.color = "white";
	error_div.style.textAlign = "center";
	error_div.style.padding = "10px";
	error_div.style.fontSize = "20px";
	error_div.style.lineHeight = "1.5";
	error_div.innerHTML = "<b>An error has occurred</b><br/>" + error;
	error_div.style.zIndex = "1000";
	document.body.appendChild(error_div);
}
// Add the error function to the window object
window.onerror = on_error;

// Controls whether to show the overlay stats and debug information or not
let OVERLAY_STATS = true, DEBUG = true;
// Comment / uncomment the following line to enable / disable the overlay stats and the debug mode
OVERLAY_STATS = DEBUG = false;

let SHOW_CRAB_SKELETON_HELPER = false;
let SHOW_GRID_HELPER = false;

const FPS = 60;

let keyboard_versions = {
	pc_keyboard: 0,
	laptop_keyboard: 1,
	typewriter_keyboard: 2
};
let selected_keyboard_version = keyboard_versions.pc_keyboard;
// selected_keyboard_version = keyboard_versions.typewriter_keyboard;

let scene, renderer, camera;
let controls, clock;
let stats;
let light, ambientLight, hemisphereLight;

const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();

let sounds = [/*
	{
		name: '...',
		offset_beat_steps: 0,
		play_each_beat_step: 128,
		audio: audio,
		play: false,
		loop: true
	}	*/
];

let scene_is_ready = false;

let orghographic_camera_size = 70;

let normal_controls_target_position = new THREE.Vector3(0, 0, 0);
let camera_is_focused_on_crab = false;

let function_keys = Array.from('1234567890qwertyuiopasdfghjklzxcvbnm');
let actual_function_keys = Array.from('qwertyuiopasdfghjklzxcvbnm');
// copy the above array
let all_keys = function_keys.slice();
all_keys.push(' ');
all_keys.push('?');
all_keys.push('Alt');	// This is the "Crab" icon, corresponding to character ~
all_keys.push(',');		// This is the "Music" icon, corresponding to character ^

let effect_canvas, effect_canvas_context;
let ground_plane, ground_plane_for_shadows;

let effect_canvas_rectangle_size, effect_canvas_square_opacity;
let effect_canvas_square_color = '#FFFFFF';

let effect_canvas_play_each_beat, effect_canvas_square_animation_time, effect_canvas_additional_size, effect_canvas_rectangle_start_size, effect_canvas_rectangle_end_size, effect_canvas_rectangle_start_opacity;
let effect_canvas_animation_is_playing = false;

let camera_start_direction = new THREE.Vector3(-0.358, 0.5065, 0.7845);
let camera_start_zoom = 47.5;
let camera_start_position = camera_start_direction.clone().multiplyScalar(camera_start_zoom);

let background_hue_offset = 98;

let crab_idle_tween_up_left, crab_idle_tween_down_center, crab_idle_tween_up_right, crab_idle_tween_down_center_2;

let bps = 170;
let beat_duration = 120 / bps;

let base_color = [
	"#7398E7",	// PC keyboard
	"#f0f0f0",	// Laptop keyboard
	"#252525"	// Typewriter keyboard
]
let buttons_color = [
	"#B2C6F2",	// PC keyboard
	"#131313",	// Laptop keyboard
	"#AF8515"	// Typewriter keyboard
]
let key_names_color = [
	"#303030",	// PC keyboard
	"#c1cbe0",	// Laptop keyboard
	"#151515"	// Typewriter keyboard
]

class KeyboardButton {
	constructor(object, key) {
		this.object = object;
		this.key = key;
		this.state = 0;
		// Tweens
		this.active_tweens = [];
	}
}

let keyboard_base_height, keyboard_base_width, keyboard_base_length,
	sub_base_height, sub_base_thickness, crab_bases_height,
	additional_crab_base_height, additional_crab_base_stroke_height;
let whole_keyboard_container = new THREE.Object3D();
whole_keyboard_container.name = 'whole_keyboard_container';

let num_of_crab_bases = 5;
let keyboard_crab_bases = [];

let keyboard_buttons = [];

let premade_loops = {
	"Q": {
		"A": ["Z", "X", "C", "B", "N", "M"],
		"F": ["Z", "X", "C", "B", "N", "M"],
		"H": ["Z", "X", "C", "B", "N", "M"],
		"J": ["Z", "X", "C", "B", "N", "M"],
		"L": ["Z", "X", "C", "B", "N", "M"]
	},
	"W": {
		"D": ["C", "N"],
		"F": ["C", "N"],
		"J": ["C", "N"],
		"K": ["C", "N"],
		"L": ["C", "N"]
	},
	"E": {
		"A": ["B", "N", "M"],
		"S": ["B", "N", "M"],
		"D": ["B", "N", "M"],
		"F": ["B", "N", "M"],
		"G": ["B", "N", "M"],
		"J": ["B", "N", "M"],
		"L": ["B", "N", "M"]
	},
	"R": {
		"A": ["X", "C", "B", "N"],
		"D": ["X", "C", "B", "N"],
		"F": ["X", "C", "B", "N"],
		"G": ["X", "C", "B", "N"],
		"H": ["X", "C", "B", "N"],
		"J": ["X", "C", "B", "N"],
		"K": ["X", "C", "B", "N"],
		"L": ["X", "C", "B", "N"]
	},
	"T": {
		"A": ["X", "C", "V", "B", "N", "M"],
		"S": ["X", "C", "V", "B", "N", "M"],
		"D": ["X", "C", "V", "B", "N", "M"],
		"F": ["X", "C", "V", "B", "N", "M"],
		"G": ["X", "C", "V", "B", "N", "M"],
		"H": ["X", "C", "V", "B", "N", "M"],
		"J": ["X", "C", "V", "B", "N", "M"],
		"K": ["X", "C", "V", "B", "N", "M"],
		"L": ["X", "C", "V", "B", "N", "M"]
	},
	"Y": {
		"A": ["Z", "C", "V", "M"],
		"S": ["Z", "C", "V", "M"],
		"D": ["Z", "C", "V", "M"],
		"G": ["Z", "C", "V", "M"],
		"H": ["Z", "C", "V", "M"],
		"J": ["Z", "C", "V", "M"],
		"K": ["Z", "C", "V", "M"]
	},
	"U": {
		"D": ["C", "V", "M"],
		"F": ["C", "V", "M"],
		"G": ["C", "V", "M"],
		"H": ["C", "V", "M"],
		"J": ["C", "V", "M"],
		"K": ["C", "V", "M"]
	},
	"I": {
		"A": ["Z", "X", "B"],
		"S": ["Z", "X", "B"],
		"D": ["Z", "X", "B"],
		"F": ["Z", "X", "B"],
		"G": ["Z", "X", "B"],
		"J": ["Z", "X", "B"],
		"K": ["Z", "X", "B"]
	},
	"O": {
		"A": ["X", "C", "B", "N", "M"],
		"S": ["X", "C", "B", "N", "M"],
		"D": ["X", "C", "B", "N", "M"],
		"F": ["X", "C", "B", "N", "M"],
		"G": ["X", "C", "B", "N", "M"],
		"J": ["X", "C", "B", "N", "M"],
		"K": ["X", "C", "B", "N", "M"],
		"L": ["X", "C", "B", "N", "M"]
	},
	"P": {
		"A": ["C", "V", "B", "N", "M"],
		"S": ["C", "V", "B", "N", "M"],
		"D": ["C", "V", "B", "N", "M"],
		"F": ["C", "V", "B", "N", "M"],
		"G": ["C", "V", "B", "N", "M"],
		"J": ["C", "V", "B", "N", "M"],
		"K": ["C", "V", "B", "N", "M"],
		"L": ["C", "V", "B", "N", "M"]
	}
}

let sub_base_pulse_color = [
	"#B2C6F2", // PC keyboard (same as buttons colors)
	"#ffffff", // Laptop keyboard
	"#303030" // Typewriter keyboard
]

let ikSolver;

let crab_legs_targets_original_positions = {};
let original_legs_offset_from_body_back_bone = {};

let crab_arms_targets_original_positions = {};

let crab_original_main_bone_height;
let crab_original_main_bone_rotation;

let selected_crab_base_index;
let previously_selected_crab_base_index = -1;
let crab_spawn_position;

let arm_bones_original_angles_and_positions = {};
// let crab_scale = 0.00425;
let crab_scale = 0.425;
let crab_model = undefined;
let crab_bones = {}

let crab_texture_colors = [
	"orange",	// PC keyboard version
	"gray",	// Laptop keyboard version
	"yellow"	// Typewriter keyboard version
];

const crab_poses = {
	transitioning: -1,
	neutral: 0,
	bass: 1,
	dj_station: 2,
	guitar: 3,
	synth: 4,
	piano: 5
};
let current_crab_pose = crab_poses.neutral;

// Contains, for each pose, the final target positions of the crab's arms
let crab_arms_targets_poses = {}

let pose_transition_animation_duration = 1000 * beat_duration / 2;

let instruments_are_on_screen = {
	bass: false,
	dj_station: false,
	guitar: false,
	synth: false,
	piano: false
}


let moving_crab = false;
let crab_movement_speed = 12.5;	// Units / seconds

let playing_idle = false;
let idle_flag = false;	// Used to start idle animation from left and right movements alternatively

// for each leg, true if leg is grounded, false otherwise
let crab_legs_state = {
	"leg_front_targetL": {
		grounded: true,
		moved_times: 0
	},
	"leg_front_targetR": {
		grounded: true,
		moved_times: 0
	},
	"leg_mid_front_targetR": {
		grounded: true,
		moved_times: 0
	},
	"leg_mid_front_targetL": {
		grounded: true,
		moved_times: 0
	},
	"leg_mid_back_targetL": {
		grounded: true,
		moved_times: 0
	},
	"leg_mid_back_targetR": {
		grounded: true,
		moved_times: 0
	},
	"leg_back_targetR": {
		grounded: true,
		moved_times: 0
	},
	"leg_back_targetL": {
		grounded: true,
		moved_times: 0
	}
};

const instruments = {
	bass: 1,
	dj_station: 2,
	guitar: 3,
	synth: 4,
	piano: 5
};

let instruments_start_scale = {
	bass: new THREE.Vector3(0, 0, 0),
	dj_station: new THREE.Vector3(0, 0, 0),
	guitar: new THREE.Vector3(0.25, 0, 0),
	synth: new THREE.Vector3(0, 0, 0),
	piano: new THREE.Vector3(0, 0, 0)
};

let clicked_screen_pos = new THREE.Vector2();

let master_volume_gain = -0.15;

let pressed_beats_key_once = false;

// Keeps track of which key is being pressed and when it was last pressed
let pressing = {};

let deltaTime = 0;

let beat_step = -1;

let holding_crab_key = false;

let sounds_are_playing = false;

let melody_sound_is_playing = false;
let melody_part_to_play = 1;

// Retrieve crab bones
function get_crab_bone(bone_name) {
	return crab_model.getObjectByName("crab_parts").skeleton.bones.find(bone => bone.name === bone_name);
}
function get_crab_main_bone() {
	let crab_main_bone = get_crab_bone("body_back");
	return crab_main_bone;
}

function refresh_crab_idle() {
	// Move crab's main bone up towards the left, than down at center, then up towards the right, than back at down center (move the bdy_back bone up and down)
	let body_back = get_crab_main_bone();
	let vertical_delta = 0.5;
	let horizontal_delta = 0.35;
	let central_position = body_back.position.clone();
	central_position.y = crab_original_main_bone_height;
	let time = beat_duration * 1000 / 4;
	// Override each tween
	crab_idle_tween_up_left = new TWEEN.Tween(body_back.position)
		.to({
			x: central_position.x - horizontal_delta,
			y: central_position.y + vertical_delta,
			// z: central_position.z
		}, time)
		.easing(TWEEN.Easing.Sinusoidal.InOut);
	crab_idle_tween_down_center = new TWEEN.Tween(body_back.position)
		.to({
			x: central_position.x,
			y: central_position.y,
			// z: central_position.z
		}, time)
		.easing(TWEEN.Easing.Sinusoidal.InOut);
	crab_idle_tween_up_right = new TWEEN.Tween(body_back.position)
		.to({
			x: central_position.x + horizontal_delta,
			y: central_position.y + vertical_delta,
			// z: central_position.z
		}, time)
		.easing(TWEEN.Easing.Sinusoidal.InOut);
	crab_idle_tween_down_center_2 = new TWEEN.Tween(body_back.position)
		.to({
			x: central_position.x,
			y: central_position.y,
			// z: central_position.z
		}, time)
		.easing(TWEEN.Easing.Sinusoidal.InOut);
	crab_idle_tween_up_left.chain(crab_idle_tween_down_center);
	crab_idle_tween_down_center.chain(crab_idle_tween_up_right);
	crab_idle_tween_up_right.chain(crab_idle_tween_down_center_2);
	crab_idle_tween_down_center_2.chain(crab_idle_tween_up_left);
}

let crab_base_texture_loader = new THREE.TextureLoader();
// let crab_textures = [];
// for (let i = 0; i < crab_texture_colors.length; i++) {
// 	let crab_texture = await crab_base_texture_loader.loadAsync('./3d/crab/Crab_Base_color_' + crab_texture_colors[i] + '.png')
// 	crab_textures.push(crab_texture);
// }

// Load the crab GLTF model
function load_crab_model(crab_texture_image = null) {
	let loader = new GLTFLoader();
	loader.load('./3d/crab/crab.gltf', function (object) {
		crab_model = object.scene;
		crab_model.name = 'crab_crab_model';
		crab_model.position.set(crab_spawn_position.x, crab_spawn_position.y + keyboard_base_height + crab_bases_height + sub_base_height + additional_crab_base_height, crab_spawn_position.z);
		crab_model.scale.set(crab_scale, crab_scale, crab_scale);
		crab_model.traverse(function (child) {
			if (child.isMesh) {
				// Set child's geometry shadows
				child.castShadow = true;
				child.receiveShadow = true;
				// Prevents object from being culled when outside scene camera frustum (avoids problems with movement animation)
				child.frustumCulled = false;

				// Set child's material 
				let material = new THREE.MeshPhysicalMaterial(child.material);
				// Set child's texture
				material.side = THREE.FrontSide;

				if (child.name == "crab_parts") {
					if (crab_texture_image != null && material.map != null && material.map != undefined) {
						let texture = material.map.clone();
						texture.image = crab_texture_image.image;
						material.map = texture;
					}
					material.metalness = 0.0;
					material.roughness = 0.65;
					material.reflectivity = 0.35;
					if (selected_keyboard_version == keyboard_versions.pc_keyboard) {
						material.emissive = new THREE.Color(0x161616);
					} else if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
						material.emissive = new THREE.Color(0x252525);
						material.roughness = 0.7;
						material.reflectivity = 0.15;
						material.metalness = 0.1;
					} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
						material.emissive = new THREE.Color(0x101010);
						material.metalnessMap = null;
						material.roughnessMap = null;
						material.roughness = 0.45;
						material.metalness = 0.175;
						material.reflectivity = 0.0;
					}
				} else if (child.name == "crab_eyes") {
					material.map = null;
					material.color = new THREE.Color(0x202020);
					material.roughness = 0.3;
					material.metalness = 0.5;
					material.reflectivity = 0.2;
				}

				material.flatShading = false;

				child.material = material;

			} else if (child.isBone) {
				crab_bones[child.name] = {
					bone: child,
					paprent: child.parent
				}
			}
		});

		// Add an helper for the crab's skeleton (i.e. bones)
		if (SHOW_CRAB_SKELETON_HELPER) {
			const helper = new THREE.SkeletonHelper(crab_model);
			helper.material.linewidth = 3;
			scene.add(helper);
		}

		// Add the IK to crab legs
		let skinnedMesh = crab_model.getObjectByName('crab_parts');
		/*
		Bones structures:
		0: root (parent: Armature)
		1:     body_back (parent: root)
		2:         leg_front_1L (parent: body_back)
		3:             leg_front_2L (parent: leg_front_1L)
		4:                 leg_front_3L (parent: leg_front_2L)
		5:                     leg_front_effectorL (parent: leg_front_3L)
		6:         leg_mid_front_1L (parent: body_back)
		7:             leg_mid_front_2L (parent: leg_mid_front_1L)
		8:                 leg_mid_front_3L (parent: leg_mid_front_2L)
		9:                     leg_mid_front_effectorL (parent: leg_mid_front_3L)
		10:         leg_mid_back_1L (parent: body_back)
		11:             leg_mid_back_2L (parent: leg_mid_back_1L)
		12:                 leg_mid_back_3L (parent: leg_mid_back_2L)
		13:                     leg_mid_back_effectorL (parent: leg_mid_back_3L)
		14:         leg_back_1L (parent: body_back)
		15:             leg_back_2L (parent: leg_back_1L)
		16:                 leg_back_3L (parent: leg_back_2L)
		17:                     leg_back_effectorL (parent: leg_back_3L)
		18:         arm_1L (parent: body_back)
		19:             arm_2L (parent: arm_1L)
		20:                 arm_3L (parent: arm_2L)
		21:                     arm_4L (parent: arm_3L)
		22:                         arm_claw_topL (parent: arm_4L)
		23:                         arm_claw_bottomL (parent: arm_4L)
		24:                         arm_effectorL (parent: arm_4L)
		25:         arm_targetL (parent: body_back)
		26:         body_front (parent: body_back)
		27:         leg_front_1R (parent: body_back)
		28:             leg_front_2R (parent: leg_front_1R)
		29:                 leg_front_3R (parent: leg_front_2R)
		30:                     leg_front_effectorR (parent: leg_front_3R)
		31:         leg_mid_front_1R (parent: body_back)
		32:             leg_mid_front_2R (parent: leg_mid_front_1R)
		33:                 leg_mid_front_3R (parent: leg_mid_front_2R)
		34:                     leg_mid_front_effectorR (parent: leg_mid_front_3R)
		35:         leg_mid_back_1R (parent: body_back)
		36:             leg_mid_back_2R (parent: leg_mid_back_1R)
		37:                 leg_mid_back_3R (parent: leg_mid_back_2R)
		38:                     leg_mid_back_effectorR (parent: leg_mid_back_3R)
		39:         leg_back_1R (parent: body_back)
		40:             leg_back_2R (parent: leg_back_1R)
		41:                 leg_back_3R (parent: leg_back_2R)
		42:                     leg_back_effectorR (parent: leg_back_3R)
		43:         arm_1R (parent: body_back)
		44:             arm_2R (parent: arm_1R)
		45:                 arm_3R (parent: arm_2R)
		46:                     arm_4R (parent: arm_3R)
		47:                         arm_claw_topR (parent: arm_4R)
		48:                         arm_claw_bottomR (parent: arm_4R)
		49:                         arm_effectorR (parent: arm_4R)
		50:         arm_targetR (parent: body_back)
		51:     leg_front_targetL (parent: root)
		52:     leg_mid_front_targetL (parent: root)
		53:     leg_mid_back_targetL (parent: root)
		54:     leg_back_targetL (parent: root)
		55:     leg_front_targetR (parent: root)
		56:     leg_mid_front_targetR (parent: root)
		57:     leg_mid_back_targetR (parent: root)
		58:     leg_back_targetR (parent: root)
		*/
		// IKs for all the crab legs
		let legs_targets_start_index = 50;
		let ik_iterations = 3;
		let iks = [
			// ----------- LEGS (8 legs) --------------------------------------------
			{
				target: legs_targets_start_index + 1,		// "leg_front_targetL"
				effector: 5,
				links: [
					{
						index: 4
					},
					{
						index: 3
					},
					{
						index: 2
					}
				],
				iteration: ik_iterations
			},
			{
				target: legs_targets_start_index + 2,		// "leg_mid_front_targetL"
				effector: 9,
				links: [
					{
						index: 8
					},
					{
						index: 7
					},
					{
						index: 6
					}
				],
				iteration: ik_iterations
			},
			{
				target: legs_targets_start_index + 3,		// "leg_mid_back_targetL"
				effector: 13,
				links: [
					{
						index: 12
					},
					{
						index: 11
					},
					{
						index: 10
					}
				],
				iteration: ik_iterations
			},
			{
				target: legs_targets_start_index + 4,		// "leg_back_targetL"
				effector: 17,
				links: [
					{
						index: 16
					},
					{
						index: 15
					},
					{
						index: 14
					}
				],
				iteration: ik_iterations
			},
			{
				target: legs_targets_start_index + 5,		// "leg_front_targetR"
				effector: 30,
				links: [
					{
						index: 29
					},
					{
						index: 28
					},
					{
						index: 27
					}
				],
				iteration: ik_iterations
			},
			{
				target: legs_targets_start_index + 6,		// "leg_mid_front_targetR"
				effector: 34,
				links: [
					{
						index: 33
					},
					{
						index: 32
					},
					{
						index: 31
					}
				],
				iteration: ik_iterations
			},
			{
				target: legs_targets_start_index + 7,		// "leg_mid_back_targetR"
				effector: 38,
				links: [
					{
						index: 37
					},
					{
						index: 36
					},
					{
						index: 35
					}
				],
				iteration: ik_iterations
			},
			{
				target: legs_targets_start_index + 8,		// "leg_back_targetR"
				effector: 42,
				links: [
					{
						index: 41
					},
					{
						index: 40
					},
					{
						index: 39
					}
				],
				iteration: ik_iterations
			},
			// ----------- ARMS (2 arms) --------------------------------------------
			{
				target: 25,		// "arm_targetL"
				effector: 24,
				links: [
					{
						index: 21
					},
					{
						index: 20
					},
					{
						index: 19
					},
					{
						index: 18
					}
				],
				iteration: ik_iterations
			},
			{
				target: 50,	// "arm_targetR"
				effector: 49,
				links: [
					{
						index: 46
					},
					{
						index: 45
					},
					{
						index: 44
					},
					{
						index: 43
					}
				],
				iteration: ik_iterations
			}
		];
		// Compute each iks link max and min rotation (for legs)
		let legsMaxAngleDelta = new THREE.Vector3(
			1 * Math.PI / 24,
			1 * Math.PI / 24,
			1 * Math.PI / 24
		);
		let legsMinAngleDelta = new THREE.Vector3(
			1 * Math.PI / 24,
			1 * Math.PI / 24,
			1 * Math.PI / 24
		);
		// Compute each iks link max and min rotation (for arms)
		let armsMaxAngleDelta = new THREE.Vector3(
			1 * Math.PI / 36,
			1 * Math.PI / 36,
			1 * Math.PI / 36
		);
		let armsMinAngleDelta = new THREE.Vector3(
			1 * Math.PI / 36,
			1 * Math.PI / 36,
			1 * Math.PI / 36
		);
		let crab_parts = crab_model.getObjectByName('crab_parts');
		iks.forEach(ik => {
			let is_arm = crab_model.getObjectByName('crab_parts').skeleton.bones[ik.target].name.startsWith('arm');
			if (is_arm) {
				// Setup min/max angles of arms' IKs
				let isLeftArm = ik.target.toString().endsWith('L');
				ik.links.forEach((link, ind) => {
					let multiplier = 1 + ind * 0;
					if (ind == 0) multiplier = 7;	// arm_4 (i.e. the "hand", the top & bottom claws parent)
					if (ind == 1) multiplier = 4.5;	// arm_3 (i.e. the "elbow")
					let diagonal_multiplier = 0.75 + ind * 0;
					if (ind == 0) diagonal_multiplier = 3.5;	// arm_4 (i.e. the "hand", the top & bottom claws parent)
					// if (ind == 1) diagonal_multiplier = 2;
					let bone = crab_parts.skeleton.bones[link.index];
					link.rotationMin = new THREE.Vector3(
						bone.rotation.x - (isLeftArm == true ? armsMinAngleDelta.x : armsMaxAngleDelta.x) * diagonal_multiplier,
						bone.rotation.y - (isLeftArm == true ? armsMinAngleDelta.y : armsMaxAngleDelta.y) * diagonal_multiplier,
						bone.rotation.z - (isLeftArm == true ? armsMinAngleDelta.z : armsMaxAngleDelta.z) * multiplier
					);
					link.rotationMax = new THREE.Vector3(
						bone.rotation.x + (isLeftArm == false ? armsMinAngleDelta.x : armsMaxAngleDelta.x) * diagonal_multiplier,
						bone.rotation.y + (isLeftArm == false ? armsMinAngleDelta.y : armsMaxAngleDelta.y) * diagonal_multiplier,
						bone.rotation.z + (isLeftArm == false ? armsMinAngleDelta.z : armsMaxAngleDelta.z) * multiplier
					);
					if (false && ind == 0) {
						// Arm 4, allow major rotation around y axis
						// let arm_4_max_degree_angle_delta = 45 * Math.PI / 180;
						// let arm_4_min_degree_angle_delta = 15 * Math.PI / 180;
						// link.rotationMin.y = bone.rotation.y - (isLeftArm == true ? arm_4_min_degree_angle_delta : arm_4_max_degree_angle_delta);
						// link.rotationMax.y = bone.rotation.y + (isLeftArm == false ? arm_4_min_degree_angle_delta : arm_4_max_degree_angle_delta);
						let arm_4_max_degree_angle_delta = 15 * Math.PI / 180;
						let arm_4_min_degree_angle_delta = 15 * Math.PI / 180;
						link.rotationMin.x = bone.rotation.x - (isLeftArm == true ? arm_4_min_degree_angle_delta : arm_4_max_degree_angle_delta);
						link.rotationMax.x = bone.rotation.x + (isLeftArm == false ? arm_4_min_degree_angle_delta : arm_4_max_degree_angle_delta);
					}
				});
			} else {
				// Set up min/max angles of legs' IKs
				let isLeftLeg = crab_model.getObjectByName('crab_parts').skeleton.bones[ik.target].name.endsWith('L');
				ik.links.forEach((link, ind) => {
					let multiplier = 2.75 + ind * 5.5;
					let diagonal_multiplier = 1.65 + ind * 0.125;
					let bone = crab_parts.skeleton.bones[link.index];
					link.rotationMin = new THREE.Vector3(
						bone.rotation.x - (isLeftLeg == true ? legsMinAngleDelta.x : legsMaxAngleDelta.x) * diagonal_multiplier,
						bone.rotation.y - (isLeftLeg == true ? legsMinAngleDelta.y : legsMaxAngleDelta.y) * multiplier,
						bone.rotation.z - (isLeftLeg == true ? legsMinAngleDelta.z : legsMaxAngleDelta.z) * diagonal_multiplier
					);
					link.rotationMax = new THREE.Vector3(
						bone.rotation.x + (isLeftLeg == false ? legsMinAngleDelta.x : legsMaxAngleDelta.x) * diagonal_multiplier,
						bone.rotation.y + (isLeftLeg == false ? legsMinAngleDelta.y : legsMaxAngleDelta.y) * multiplier,
						bone.rotation.z + (isLeftLeg == false ? legsMinAngleDelta.z : legsMaxAngleDelta.z) * diagonal_multiplier
					);
				});
			}
		});
		// console.log(iks);
		ikSolver = new CCDIKSolver(skinnedMesh, iks);

		// Move crab down from starting pose
		let initial_crab_main_bone_delta = -0.5;
		// let initial_crab_main_bone_delta = 0;
		let crab_main_bone = get_crab_main_bone();
		let pos = crab_main_bone.position.clone();
		crab_main_bone.position.set(pos.x, pos.y + initial_crab_main_bone_delta, pos.z);

		// Move crab legs towards center from starting pose (i.e. move crab legs targets towards the crab's body_back bone)
		let targets = [
			"leg_front_targetL",
			"leg_front_targetR",
			"leg_mid_front_targetL",
			"leg_mid_front_targetR",
			"leg_mid_back_targetL",
			"leg_mid_back_targetR",
			"leg_back_targetL",
			"leg_back_targetR"
		]
		targets.forEach(target => {
			let crab_leg_target = skinnedMesh.skeleton.bones.find(bone => bone.name === target);
			let crab_leg_target_pos = crab_leg_target.position.clone();
			let crab_body_back_bone_pos = crab_main_bone.position.clone();
			let direction = crab_body_back_bone_pos.clone().sub(crab_leg_target_pos).normalize();
			let delta = 0.75;
			crab_leg_target.position.set(
				crab_leg_target_pos.x + direction.x * delta,
				crab_leg_target_pos.y,
				crab_leg_target_pos.z + direction.z * delta
			);
		});

		let updates = 100;
		for (let i = 0; i < updates; i++) {
			ikSolver.update();
		}

		/*
		51:     leg_front_targetL (parent: root)
		52:     leg_mid_front_targetL (parent: root)
		53:     leg_mid_back_targetL (parent: root)
		54:     leg_back_targetL (parent: root)
		55:     leg_front_targetR (parent: root)
		56:     leg_mid_front_targetR (parent: root)
		57:     leg_mid_back_targetR (parent: root)
		58:     leg_back_targetR (parent: root)
		*/

		crab_legs_targets_original_positions = {
			leg_front_targetL: skinnedMesh.skeleton.bones[51].position.clone(),
			leg_front_targetR: skinnedMesh.skeleton.bones[55].position.clone(),
			leg_mid_front_targetR: skinnedMesh.skeleton.bones[56].position.clone(),
			leg_mid_front_targetL: skinnedMesh.skeleton.bones[52].position.clone(),
			leg_mid_back_targetL: skinnedMesh.skeleton.bones[53].position.clone(),
			leg_mid_back_targetR: skinnedMesh.skeleton.bones[57].position.clone(),
			leg_back_targetR: skinnedMesh.skeleton.bones[58].position.clone(),
			leg_back_targetL: skinnedMesh.skeleton.bones[54].position.clone()
		};
		original_legs_offset_from_body_back_bone = {
			leg_front_targetL: skinnedMesh.skeleton.bones[51].position.clone().sub(skinnedMesh.skeleton.bones[1].position),
			leg_front_targetR: skinnedMesh.skeleton.bones[55].position.clone().sub(skinnedMesh.skeleton.bones[1].position),
			leg_mid_front_targetR: skinnedMesh.skeleton.bones[56].position.clone().sub(skinnedMesh.skeleton.bones[1].position),
			leg_mid_front_targetL: skinnedMesh.skeleton.bones[52].position.clone().sub(skinnedMesh.skeleton.bones[1].position),
			leg_mid_back_targetL: skinnedMesh.skeleton.bones[53].position.clone().sub(skinnedMesh.skeleton.bones[1].position),
			leg_mid_back_targetR: skinnedMesh.skeleton.bones[57].position.clone().sub(skinnedMesh.skeleton.bones[1].position),
			leg_back_targetR: skinnedMesh.skeleton.bones[58].position.clone().sub(skinnedMesh.skeleton.bones[1].position),
			leg_back_targetL: skinnedMesh.skeleton.bones[54].position.clone().sub(skinnedMesh.skeleton.bones[1].position)
		};

		// console.log(crab_legs_targets);
		// console.log(original_legs_offset_from_body_back_bone);

		crab_arms_targets_original_positions = {
			arm_targetL: skinnedMesh.skeleton.bones[25].position.clone(),
			arm_targetR: skinnedMesh.skeleton.bones[50].position.clone()
		};

		crab_arms_targets_poses = {
			transitioning: {
				arm_targetL: crab_arms_targets_original_positions.arm_targetL.clone(),
				arm_targetR: crab_arms_targets_original_positions.arm_targetR.clone()
			},
			neutral: {
				arm_targetL: crab_arms_targets_original_positions.arm_targetL.clone(),
				arm_targetR: crab_arms_targets_original_positions.arm_targetR.clone()
			},
			bass: {
				arm_targetL: new THREE.Vector3(2.92, 5.043, 0.584),
				arm_targetR: new THREE.Vector3(-0.942, 5.596 + 0.1, -0.912 - 0.2)
			},
			dj_station: {
				arm_targetL: new THREE.Vector3(2.37 + 0.5, 5.17, -1.246 - 0.375),
				arm_targetR: new THREE.Vector3(-2.37 - 0.5, 5.17, -1.246 - 0.375)
			},
			guitar: {
				arm_targetL: new THREE.Vector3(3.45, 4.67, -1.80),
				arm_targetR: new THREE.Vector3(-0.551, 5.065, -1.548)
			},
			synth: {
				arm_targetL: new THREE.Vector3(2.37 + 0.3, 5.17 - 0.5, -1.246 - 0.05),
				arm_targetR: new THREE.Vector3(-2.37 - 0.3, 5.17 - 0.5, -1.246 - 0.05)
			},
			piano: {
				arm_targetL: new THREE.Vector3(2.37, 5.17 - 0.5, -1.246 - 0.115),
				arm_targetR: new THREE.Vector3(-2.37, 5.17 - 0.5, -1.246 - 0.115)
			}
		};

		// Cycle through all the bones of the crab's skeleton and store each arm bone's original rotation and position into the "arm_bones_original_angles_and_positions" object
		arm_bones_original_angles_and_positions = {};
		let crab_parts_bones = crab_model.getObjectByName('crab_parts').skeleton.bones;
		crab_parts_bones.forEach(bone => {
			if (bone.name.startsWith('arm')) {
				arm_bones_original_angles_and_positions[bone.name] = {
					rotation: bone.rotation.clone(),
					position: bone.position.clone()
				};
			}
		});

		// Height of the crab's body_back bone
		crab_original_main_bone_height = pos.y + initial_crab_main_bone_delta;
		crab_original_main_bone_rotation = crab_main_bone.rotation.clone();

		refresh_crab_idle();

		scene.add(crab_model);

	});
}

async function set_crab_color(crab_color_string) {
	if (crab_model == null || crab_model == undefined) return;
	let texture_index = crab_texture_colors.indexOf(crab_color_string);
	let crab_texture_image = crab_textures[texture_index];
	crab_model.traverse(function (child) {
		if (child.isMesh) {
			// Set child's geometry shadows
			child.castShadow = true;
			child.receiveShadow = true;
			// Prevents object from being culled when outside scene camera frustum (avoids problems with movement animation)
			child.frustumCulled = false;

			// Set child's material 
			let material = new THREE.MeshPhysicalMaterial(child.material);
			// Set child's texture
			material.side = THREE.FrontSide;

			if (child.name == "crab_parts") {
				if (crab_texture_image != null && material.map != null && material.map != undefined) {
					let texture = material.map.clone();
					texture.image = crab_texture_image.image;
					material.map = texture;
				}
				material.metalness = 0.0;
				material.roughness = 0.65;
				material.reflectivity = 0.35;
				if (selected_keyboard_version == keyboard_versions.pc_keyboard) {
					material.emissive = new THREE.Color(0x161616);
				} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
					material.metalnessMap = null;
					material.roughnessMap = null;
					material.roughness = 0.3;
					material.metalness = 0.125;
					material.reflectivity = 0.3;
				}
			} else if (child.name == "crab_eyes") {
				material.map = null;
				material.color = new THREE.Color(0x202020);
				material.roughness = 0.3;
				material.metalness = 0.5;
				material.reflectivity = 0.2;
			}

			material.flatShading = false;

			child.material = material;
		}
	});
	return;
}

// let leads_play_each_step = 32;
let melodies_play_each_step = 128;

// Load all sounds in the "./sounds" folder with their names
function load_sounds() {
	// Load all kick-snare loops
	let kick_snare_volume = 0.435;
	for (let i = 1; i <= 10; i++) {
		let sound_name = "./sounds/loops/loop_kick_snare_loop_#.wav";
		const audio = get_sound_resource(sound_name, i, true, kick_snare_volume);
		// Change audio pitch without changing the playback rate

		let audio_obj = {
			name: 'kick_snare_' + i.toString(),
			offset_beat_steps: 0,
			play_each_beat_step: 128,
			audio: audio,
			play: false,
			loop: true,
			play_once: false
		}
		sounds.push(audio_obj);
	}
	// Load all hi-hat loops
	let hi_hats_volume = 0.5;
	for (let i = 1; i <= 9; i++) {
		let sound_name = "./sounds/loops/loop_hi_hat_loop_#.wav";
		const audio = get_sound_resource(sound_name, i, true, hi_hats_volume);
		let audio_obj = {
			name: 'hi_hat_' + i.toString(),
			offset_beat_steps: 0,
			play_each_beat_step: 128,
			audio: audio,
			play: false,
			loop: true,
			play_once: false
		}
		sounds.push(audio_obj);
	}
	// Load all bass loops
	let bass_volume = 0.42;
	for (let i = 1; i <= 7; i++) {
		let sound_name = "./sounds/loops/loop_bass_loop_#.wav";
		const audio = get_sound_resource(sound_name, i, true, bass_volume);
		let audio_obj = {
			name: 'kick_' + i.toString(),
			offset_beat_steps: 0,
			play_each_beat_step: 128,
			audio: audio,
			play: false,
			loop: true,
			play_once: false
		}
		sounds.push(audio_obj);
	}
	// Load all the melodies
	let melodies_volume = 0.475;
	for (let i = 1; i <= 5; i++) {
		for (let j = 1; j <= 4; j++) {
			let sound_name = "./sounds/melodies/melody_#_P" + (j.toString()) + ".wav";
			const audio = get_sound_resource(sound_name, i, true, melodies_volume);
			let audio_obj = {
				name: 'melody_' + i.toString() + '_P' + j.toString(),
				offset_beat_steps: 0,
				play_each_beat_step: melodies_play_each_step,
				audio: audio,
				play: false,
				loop: true,
				play_once: true
			}
			sounds.push(audio_obj);
		}
	}
}
// Get a sound resource given its base name, the number of the sound, whether to pad the number with a 0 if it's less than 10, and the volume of the sound
function get_sound_resource(sound_base_name, sound_num, pad_name_number = true, volume = 0.5) {
	let sound_num_string = sound_num.toString();
	if (sound_num < 10 && pad_name_number) sound_num_string = '0' + sound_num_string;
	let sound_url = sound_base_name.replace('#', sound_num_string);
	// const audio = new Audio(sound_url);
	const audio = getAudioSource(sound_url, volume);
	return audio;
}
// Create a global audio source (for "detune", 1 is a semitone, 12 is an octave)
function getAudioSource(url, volume = 0.5) {
	const sample = new THREE.Audio(listener);
	audioLoader.load(url, function (buffer) {
		sample.setBuffer(buffer);
		sample.setLoop(false);
		sample.setVolume(volume + master_volume_gain);
	});
	return sample;
}
load_sounds();

async function start_scene() {

	/**
	 * @description Creates a material given a color string (also as CSS color value string), a shininess value and a specular color
	 * @returns The created THREE.js material */
	function create_material(color_str, shininess_val = 50, specular_col = 0x111111, shade_flat = false, side = THREE.FrontSide, metalness = 0) {
		// return new THREE.MeshPhongMaterial({
		// 	// set color as a css rgb string
		// 	color: color_str,
		// 	side: side,
		// 	flatShading: shade_flat,
		// 	// flatShading: true,
		// 	wireframe: false,
		// 	shininess: shininess_val,
		// 	specular: specular_col
		// 	// castShadow: true,
		// 	// receiveShadow: true
		// });
		let roughness = 1 - shininess_val / 100;
		let material = new THREE.MeshStandardMaterial({
			// set color as a css rgb string
			color: color_str,
			side: side,
			flatShading: shade_flat,
			// flatShading: true,
			wireframe: false,
			roughness: roughness,
			metalness: metalness,
			// shininess: shininess_val,
			// specular: specular_col,
			// castShadow: true,
			// receiveShadow: true
		});
		material.map = null;
		material.needsUpdate = true;
		return material;
	}
	/**
	 * @description Creates a cube given the width, length and height of the cube
	 * @returns The created THREE.js cube */
	function create_cube(width, length, height, mat) {
		// wrapper for the above function
		// return create_cube_given_verts(new THREE.Vector3(-width / 2, -length / 2, -height / 2), new THREE.Vector3(width / 2, length / 2, height / 2), mat);
		const cubeGeometry = new THREE.BoxGeometry(width, length, height);
		// create a cube mesh
		const cube = new THREE.Mesh(cubeGeometry, mat);
		// return the cube
		return cube;
	}

	/**
	 * @description Creates a box (with the given thickness for its faces) given the width, length and height of the box<br/>
	 * @returns The created THREE.js box faces' container
	 */
	function create_box(width, length, height, thickness, mat, skip_faces = []) {
		// return crete_box_given_verts(new THREE.Vector3(width / 2, length / 2, height / 2), new THREE.Vector3(-width / 2, -length / 2, -height / 2), thickness, mat, skip_faces);
		if (skip_faces.length === 0) skip_faces = [false, false, false, false, false, false];
		// create the 6 faces such that the box has the given width, length and height, and each face has a thickness of the given thickness, towards the inside of the box
		const faces = new THREE.Object3D();
		faces.name = 'box_faces_container';
		// Create the front face
		if (!skip_faces[0]) {
			const frontFace = create_cube(width, thickness, height, mat);
			frontFace.position.set(0, length / 2 - thickness / 2, 0);
			frontFace.castShadow = true;
			frontFace.receiveShadow = true;
			faces.add(frontFace);
		}
		// Create the back face
		if (!skip_faces[1]) {
			const backFace = create_cube(width, thickness, height, mat);
			backFace.position.set(0, -length / 2 + thickness / 2, 0);
			backFace.castShadow = true;
			backFace.receiveShadow = true;
			faces.add(backFace);
		}
		// Create the left face
		if (!skip_faces[2]) {
			const leftFace = create_cube(thickness, length, height, mat);
			leftFace.position.set(-width / 2 + thickness / 2, 0, 0);
			leftFace.castShadow = true;
			leftFace.receiveShadow = true;
			faces.add(leftFace);
		}
		// Create the right face
		if (!skip_faces[3]) {
			const rightFace = create_cube(thickness, length, height, mat);
			rightFace.position.set(width / 2 - thickness / 2, 0, 0);
			rightFace.castShadow = true;
			rightFace.receiveShadow = true;
			faces.add(rightFace);
		}
		// Create the top face
		if (!skip_faces[4]) {
			const topFace = create_cube(width, length, thickness, mat);
			topFace.position.set(0, 0, height / 2 - thickness / 2);
			topFace.castShadow = true;
			topFace.receiveShadow = true;
			faces.add(topFace);
		}
		// Create the bottom face
		if (!skip_faces[5]) {
			const bottomFace = create_cube(width, length, thickness, mat);
			bottomFace.position.set(0, 0, -height / 2 + thickness / 2);
			bottomFace.castShadow = true;
			bottomFace.receiveShadow = true;
			faces.add(bottomFace);
		}
		// return the faces
		return faces;
	}

	/**
	 * @description Creates the lights of the scene (point lights and ambient lights)
	 */
	function create_lights() {
		// Create a light
		let light_intensity = 2.85;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) light_intensity = 4.25;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) light_intensity = 2;
		light = new THREE.DirectionalLight(0xffffff, light_intensity);
		light.name = 'directional_light';
		let light_initial_position = new THREE.Vector3(35, 95, 25);
		// let light_initial_position = new THREE.Vector3(25, 95, -15);
		light.position.set(light_initial_position.x, light_initial_position.y, light_initial_position.z);
		light.target.position.set(0, 0, 0);

		// Move the light forwards and backwards on the x axis
		// let light_animation_time = 10000;
		// let movement_delta = -1 * light_initial_position.z * 2;
		// let light_animation_tween = new TWEEN.Tween(light.position)
		// 	.to({
		// 		z: movement_delta
		// 	}, light_animation_time)
		// 	.easing(TWEEN.Easing.Sinusoidal.InOut)
		// 	.onUpdate(() => {
		// 		light.target.updateMatrixWorld();
		// 	});
		// light_animation_tween.repeat(Infinity);
		// light_animation_tween.yoyo(true);
		// light_animation_tween.start();

		light.castShadow = true;
		light.shadow.mapSize.set(4096, 4096);

		let size = 35;
		light.shadow.camera.left = -1 * size;
		light.shadow.camera.right = size;
		light.shadow.camera.top = size;
		light.shadow.camera.bottom = -1 * size;
		light.shadow.camera.near = 90;
		light.shadow.camera.far = 132;

		light.shadow.radius = 2.5;
		light.shadow.bias = 0.00005;
		light.shadow.blurSamples = 100;

		// light = new THREE.PointLight(0xffffff, 2150, 1000);
		// light.color.setHSL(0, 1, 0.95);
		// light.decay = 1.5;
		// light.position.set(25, 85, 30);
		// light.castShadow = true;

		// light.shadowCameraVisible = true;

		// let size = 2;

		// light.shadow.mapSize.set(4096, 4096);
		// light.shadow.camera.left = -1 * size;
		// light.shadow.camera.right = size;
		// light.shadow.camera.top = size;
		// light.shadow.camera.bottom = -1 * size;
		// light.shadow.camera.near = 0.1;
		// light.shadow.camera.far = 10;
		// // light.shadow.camera.target = new THREE.Vector3(0, 0, 0);
		// light.shadow.radius = 0.5;
		// light.shadow.bias = 0.00005;
		// light.shadow.blurSamples = 10;

		// light.shadow.bias = 0.001;
		// light.name = 'point_light';

		scene.add(light);
		// Create an ambient light
		ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
		ambientLight.intensity = 2.5;
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) ambientLight.intensity = 1;
		ambientLight.name = 'ambient_light';
		scene.add(ambientLight);
		// // Create a rectangular area light
		// rectAreaLight = new THREE.RectAreaLight(0xffffff, 1000, 100, 100);
		// rectAreaLight.position.set(5, 5, 5);
		// rectAreaLight.lookAt(0, 0, 0);
		// rectAreaLight.name = 'rect_light';
		// scene.add(rectAreaLight);

		// Create an emisphere light
		let hemisphereLight_intensity = 0.5;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) hemisphereLight_intensity = 2;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) hemisphereLight_intensity = 1;
		hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, hemisphereLight_intensity);	// NOTE: these are NOT the actual emisphere colors, they are set when moving the camera around
		hemisphereLight.position.set(0, 1, 0);
		scene.add(hemisphereLight);

	}

	function create_basic_objects() {

		// Create an invisible plane that will receive shadows (using ShadowMaterial)
		const planeGeometry = new THREE.PlaneGeometry(250, 250);

		effect_canvas = document.getElementById('effect-canvas');
		// effect_canvas.id = 'effect-canvas';

		effect_canvas_context = effect_canvas.getContext('2d');

		effect_canvas.width = 1000;
		effect_canvas.height = 1000;
		effect_canvas.style.position = 'absolute';
		effect_canvas.style.top = '0';
		effect_canvas.style.left = '0';
		effect_canvas.style.zIndex = '-10';
		effect_canvas.style.pointerEvents = 'none';
		effect_canvas.style.opacity = '0.2';
		effect_canvas.style.backgroundColor = '#000000';

		let canvas_map = new THREE.CanvasTexture(effect_canvas);

		let planeMaterial = new THREE.MeshBasicMaterial({
			map: canvas_map,
			// color: '#FFFFFF',
			// emissive: '#FFFFFF',
			// emissiveIntensity: 0.5,
			// roughness: 0.5,
			// metalness: 0.5,
			side: THREE.DoubleSide,
			// flatShading: true,
			// wireframe: false,
			// shininess: 20,
			// specular: 0x383838,
			transparent: true,
			opacity: 1,
			// shadows: true,
			// shadowSide: THREE.DoubleSide
			// castShadow: true,
			// receiveShadow: true
		});

		planeMaterial.map.needsUpdate = true;

		// planeMaterial.transparent = true;
		// planeMaterial.opacity = 0.2;
		ground_plane = new THREE.Mesh(planeGeometry, planeMaterial);
		// ground_plane.receiveShadow = true;
		ground_plane.rotation.x = -1 * Math.PI / 2;
		ground_plane.name = 'ground_plane';
		ground_plane.position.y = -0.025;
		scene.add(ground_plane);

		// Also create the ground plane for shadows (using ShadowMaterial)
		const planeMaterialForShadows = new THREE.ShadowMaterial();
		planeMaterialForShadows.transparent = true;
		planeMaterialForShadows.opacity = 0.05;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) planeMaterialForShadows.opacity = 0.1;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) planeMaterialForShadows.opacity = 0.2;
		ground_plane_for_shadows = new THREE.Mesh(planeGeometry, planeMaterialForShadows);
		ground_plane_for_shadows.receiveShadow = true;
		ground_plane_for_shadows.rotation.x = -1 * Math.PI / 2;
		ground_plane_for_shadows.name = 'ground_plane_for_shadows';
		scene.add(ground_plane_for_shadows);
	}

	function animate_effect_canvas_single_rectangle() {

		if (effect_canvas_square_opacity == 0) {
			effect_canvas_context.clearRect(0, 0, effect_canvas.width, effect_canvas.height);
			ground_plane.material.map.needsUpdate = true;
			effect_canvas_square_opacity = -1;
			return;
		} else if (effect_canvas_square_opacity < 0) {
			return;
		}

		// Update the square size and opacity variables
		effect_canvas_rectangle_size.x += (effect_canvas_rectangle_end_size.x - effect_canvas_rectangle_start_size.x) / (effect_canvas_square_animation_time * FPS);
		effect_canvas_rectangle_size.y += (effect_canvas_rectangle_end_size.y - effect_canvas_rectangle_start_size.y) / (effect_canvas_square_animation_time * FPS);
		effect_canvas_square_opacity -= (effect_canvas_rectangle_start_opacity) / (effect_canvas_square_animation_time * FPS);

		// Clear the canvas
		effect_canvas_context.clearRect(0, 0, effect_canvas.width, effect_canvas.height);
		// Update the square size and opacity
		effect_canvas_context.fillStyle = effect_canvas_square_color;
		effect_canvas_context.globalAlpha = effect_canvas_square_opacity < 0 ? 0 : effect_canvas_square_opacity;
		// Draw the square
		effect_canvas_context.fillRect(effect_canvas.width / 2 - effect_canvas_rectangle_size.x / 2, effect_canvas.height / 2 - effect_canvas_rectangle_size.y / 2, effect_canvas_rectangle_size.x, effect_canvas_rectangle_size.y);

		// Restart when the square reaches the maximum size
		// if (effect_canvas_square_opacity <= 0) {
		// 	// Reset the square size and opacity
		// 	restart_effect_canvas_animation();
		// }
		ground_plane.material.map.needsUpdate = true;
	}

	function restart_effect_canvas_animation() {
		effect_canvas_rectangle_size = effect_canvas_rectangle_start_size.clone();
		effect_canvas_square_opacity = effect_canvas_rectangle_start_opacity;
	}

	function initialize_effect_canvas_animation() {

		effect_canvas_play_each_beat = 0.5;
		effect_canvas_square_animation_time = effect_canvas_play_each_beat * beat_duration;	// Animation time in seconds
		effect_canvas_additional_size = 15;
		let size_multiply_factor = 4;
		effect_canvas_rectangle_start_size = new THREE.Vector2(
			size_multiply_factor * keyboard_base_width,
			size_multiply_factor * keyboard_base_length);
		effect_canvas_rectangle_end_size = new THREE.Vector2(
			size_multiply_factor * (keyboard_base_width + effect_canvas_additional_size),
			size_multiply_factor * (keyboard_base_length + effect_canvas_additional_size));
		effect_canvas_rectangle_start_opacity = 0.125;

		// animation_fps = 24;

	}
	function start_effect_canvas_animation() {
		// Make it so that the effect ganvas gets drawn squares starting from the center which get bigger and bigger and also transparent towards the end, then disappear and another square appears
		restart_effect_canvas_animation();
		effect_canvas_animation_is_playing = true;
	}
	function stop_effect_canvas_animation() {

		effect_canvas_animation_is_playing = false;
		// clearInterval(keyboard_base_squares_animation_interval);

		// effect_canvas_square_opacity = -1;
		// effect_canvas_context.clearRect(0, 0, effect_canvas.width, effect_canvas.height);
		// ground_plane.material.map.needsUpdate = true;


		// console.log('Stopping effect canvas animation');
	}

	/**
	 * @description Initializes the scene, camera and renderer (also enables orbit controls and creates a "clock" THREE js object)
	 */
	function initialize_scene() {

		// Create a renderer
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.name = 'renderer';
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		// renderer.aspect = window.innerWidth / window.innerHeight;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.autoUpdate = true;
		// renderer.shadowMap.type = THREE.BasicShadowMap;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		// Set the tone mapping for a stylized effect
		renderer.toneMapping = THREE.CineonToneMapping;
		renderer.toneMappingExposure = 1.75;

		document.body.appendChild(renderer.domElement);

		// Setup a perspective camera
		set_camera(true);
		let camera_initial_tempory_zoom = 65;
		let camera_initial_temporary_direction = new THREE.Vector3(-1 / 3.75, 1, 1 / 3);
		camera.position.set(camera_initial_tempory_zoom * camera_initial_temporary_direction.x, camera_initial_tempory_zoom * camera_initial_temporary_direction.y, camera_initial_tempory_zoom * camera_initial_temporary_direction.z);

		// Gradually move the camera, with an ease in out movement, to the camera destination position
		// let camera_animation_time = 2000;
		// let delay_time = 1000;
		// let camera_animation_tween = new TWEEN.Tween(camera.position)
		// 	.to(camera_destination_position, camera_animation_time)
		// 	.easing(TWEEN.Easing.Quadratic.InOut)
		// 	.onUpdate(() => {
		// 		update_scene_background_color();
		// 	});
		// camera_animation_tween.delay(delay_time);
		// camera_animation_tween.start();

		// Create an audio listener
		camera.add(listener);

		// Create a scene
		scene = new THREE.Scene();
		scene.name = 'scene';

		// Enable orbit controls
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) normal_controls_target_position = new THREE.Vector3(0, 2.25, 0);
		controls = new OrbitControls(camera, renderer.domElement);
		if (!OVERLAY_STATS) {
			controls.maxDistance = 100;
			controls.minDistance = 12.5;
		}
		controls.addEventListener('change', function () {
			update_scene_background_color();
			// face_crab_towards_camera();
		});
		controls.enableDamping = true;
		controls.dampingFactor = 0.35;

		// Create a clock (for time-based animations and calculations)
		clock = new THREE.Clock();

		// controls.target = new THREE.Vector3(0, 0, -12);
		controls.target = new THREE.Vector3(normal_controls_target_position.x, normal_controls_target_position.y, normal_controls_target_position.z);

		// Set camera background color
		update_scene_background_color();

	}
	function set_camera(perspective_camera = true, set_position = true) {
		if (perspective_camera) {
			// Create a perspective camera
			let camera_fov = 25;
			camera = new THREE.PerspectiveCamera(camera_fov, window.innerWidth / window.innerHeight, 0.01, 1000);
		} else {
			// Create an orthographic camera
			camera = new THREE.OrthographicCamera(
				window.innerWidth / -orghographic_camera_size,
				window.innerWidth / orghographic_camera_size,
				window.innerHeight / orghographic_camera_size,
				window.innerHeight / -orghographic_camera_size,
				0.001, 100);
			camera.name = 'camera';
		}
		// Set camera position (i.e. initial zoom)
		if (set_position) camera.position.set(camera_start_position.x, camera_start_position.y, camera_start_position.z);
	}
	function refresh_orthographic_camera_size() {
		if (camera.isOrthographicCamera) {
			let orghographic_camera_size = 50;
			camera.left = window.innerWidth / -orghographic_camera_size;
			camera.right = window.innerWidth / orghographic_camera_size;
			camera.top = window.innerHeight / orghographic_camera_size;
			camera.bottom = window.innerHeight / -orghographic_camera_size;
			camera.updateProjectionMatrix();
		}
	}

	// Calculate a random color based on the camera position, with a certain saturation and lightness
	function update_scene_background_color() {
		// Calculate the color actually based on the angle with the y axis
		// let hue_offset = 95;
		let hue = (360 - background_hue_offset + camera.rotation.y * 360 / Math.PI) % 360;
		// let color_str = `hsl(${hue}, 60%, 58%)`;
		let saturation = 59;
		let lightness = 59;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
			saturation = 20;
			lightness = 40;
		} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
			// saturation = 15;
			// lightness = 25;
			saturation = 15;
			lightness = 17;
		}
		let color_str = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
		// let bg_col = '#6281BE';
		// Set the background color of the scene
		renderer.setClearColor(color_str);

		// Update the hemisphere light to match the background color
		if (hemisphereLight !== undefined) {
			let hem_light_saturation = 75;
			let hem_light_lightness = 25;
			if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
				hem_light_saturation = 90;
				hem_light_lightness = 30;
			}
			let hem_light_color_str = `hsl(${hue}, ${hem_light_saturation}%, ${hem_light_lightness}%)`;
			hemisphereLight.groundColor.set(hem_light_color_str);
		}
	}
	/**
	 * @description Sets up the page (adds stats, camera position, debug checkbox, window resize listeners, etc...)
	 */
	function set_up_page() {

		// Make it so that the view always fits with the screen
		// $(window).resize(function () {
		window.addEventListener('resize', function () {

			const width = window.innerWidth;
			const height = window.innerHeight;
			// const aspect = width / height;

			if (camera.isPerspectiveCamera) {
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
			} else if (camera.isOrthographicCamera) {
				refresh_orthographic_camera_size();
			}

			renderer.setSize(width, height);
		});

		if (OVERLAY_STATS) {

			// Append three.js stats to the page
			stats = new Stats();
			document.body.appendChild(stats.dom);

			// Append an element in the top right of the screen containing a (white) text with the current psition and rotation of the camera
			// const cameraPosition = $('<div id="camera-position"></div>');
			const cameraPosition = document.createElement('div');
			cameraPosition.id = 'camera-position';
			cameraPosition.css({
				position: 'absolute',
				top: '0',
				right: '0',
				color: 'white',
				backgroundColor: '#00000050',
				padding: '10px',
				fontFamily: 'monospace',
				fontSize: '12px',
				zIndex: '100'
			});
			document.body.appendChild(cameraPosition[0]);

			// Append a checkbox to the top right stats div for camera that enables/disables the debug mode (USE jQuery)
			// const debugCheckbox = $('<input type="checkbox" id="debug_checkbox" name="debug_checkbox" value="debug_checkbox">');
			const debugCheckbox = document.createElement('input');
			debugCheckbox.type = 'checkbox';
			debugCheckbox.id = 'debug_checkbox';
			debugCheckbox.name = 'debug_checkbox';
			debugCheckbox.value = 'debug_checkbox';
			debugCheckbox.css({
				zIndex: '100',
				width: '18px',
				height: '18px',
				margin: "auto",
				verticalAlign: "middle",
				marginLeft: '5px'
			});
			// const debugCheckboxLabel = $('<label for="debug_checkbox">Debug</label>');
			const debugCheckboxLabel = document.createElement('label');
			debugCheckboxLabel.htmlFor = 'debug_checkbox';
			debugCheckboxLabel.innerHTML = 'Debug';
			debugCheckboxLabel.css({
				zIndex: '100',
				color: 'white',
				padding: '10px',
				fontFamily: 'monospace',
				fontSize: '14px'
			});
			const debugCheckboxDiv = $('<div></div>');
			debugCheckboxDiv.css({
				position: 'absolute',
				top: '65px',
				right: '0',
				zIndex: '100',
				backgroundColor: '#00000050',
				padding: '5px'
			});
			debugCheckbox.change(function () {
				DEBUG = this.checked;
				refresh_debug();
			});
			// Make the checkbox checked if the debug mode is enabled
			debugCheckbox.prop('checked', DEBUG);
			debugCheckboxDiv.append(debugCheckbox);
			debugCheckboxDiv.append(debugCheckboxLabel);
			// $('body').append(debugCheckboxDiv);
			document.body.appendChild(debugCheckboxDiv[0]);
		}
	}
	// Create a function that updates the camera position and rotation
	function updateCameraPosition() {
		const position = camera.position;
		const rotation = camera.rotation;
		const x = position.x.toFixed(2);
		const y = position.y.toFixed(2);
		const z = position.z.toFixed(2);
		const alpha = rotation.x.toFixed(2);
		const beta = rotation.y.toFixed(2);
		const gamma = rotation.z.toFixed(2);
		// $("#camera-position").html(`pos.x: ${x}, pos.y: ${y}, pos.z: ${z}<br/><br/>rot.x: ${alpha}, rot.y: ${beta}, rot.z: ${gamma}`);
		document.getElementById('camera-position').innerHTML = `pos.x: ${x}, pos.y: ${y}, pos.z: ${z}<br/><br/>rot.x: ${alpha}, rot.y: ${beta}, rot.z: ${gamma}`;
	}
	function refresh_debug() {

		if (DEBUG) {

			// console.log('Adding debug helpers');

			// Create a helper for the point light
			const helper = new THREE.PointLightHelper(light);
			helper.name = 'point_light_helper';
			scene.add(helper);
			// Create a helper for the rect area light
			// const rectAreaLightHelper = new THREE.RectAreaLightHelper(rectAreaLight);
			// rectAreaLightHelper.name = 'rect_light_helper';
			// scene.add(rectAreaLightHelper);

			if (SHOW_GRID_HELPER) {
				// Create an axes helper
				const grid_size = 100;
				const axesHelper = new THREE.AxesHelper(grid_size);
				axesHelper.name = 'axes_helper';
				scene.add(axesHelper);
				// Create a grid
				const gridHelper = new THREE.GridHelper(grid_size, grid_size);
				gridHelper.name = 'grid_helper';
				scene.add(gridHelper);
			}

			// Create a shadowmap helper
			var light_shadow_helper = new THREE.CameraHelper(light.shadow.camera);
			light_shadow_helper.name = 'light_shadow_helper';
			scene.add(light_shadow_helper);

		} else {

			// console.log('Removing debug helpers');

			// Remove the helper for the light
			scene.remove(scene.getObjectByName('point_light_helper'));
			// Remove the axes helper
			scene.remove(scene.getObjectByName('axes_helper'));
			// Remove the grid
			scene.remove(scene.getObjectByName('grid_helper'));
			// Remove the shadowmap helper
			scene.remove(scene.getObjectByName('light_shadow_helper'));

		}
	}

	// Initialize the scene
	initialize_scene();

	// Create scene lights
	create_lights();

	// Creates the scene base objects (e.g. the ground invisible plane)
	create_basic_objects();

	// Set up the html page (add stats, camera position, debug checkbox, window resize listeners, etc...)
	set_up_page();

	refresh_debug();

	function load_json(url) {
		let json = null;
		let request = new XMLHttpRequest();
		request.open('GET', url, false);
		request.send(null);
		if (request.status == 200) {
			json = JSON.parse(request.responseText);
		}
		return json;
	}

	async function create_keyboard() {

		async function create_keyboard_button(x_width = 1, z_length = 1, y_height = 1, use_typewriter_button = false) {
			let vertices, faces;
			if (!use_typewriter_button) {
				// Create a geometry from the vertices and faces below
				vertices = new Float32Array([

					-1.000000 - (x_width - 1), 0.000000 * y_height, 1.000000 + (z_length - 1),

					-1.000000 - (x_width - 1), 0.000000 * y_height, -1.000000 - (z_length - 1),

					1.000000 + (x_width - 1), 0.000000 * y_height, 1.000000 + (z_length - 1),

					1.000000 + (x_width - 1), 0.000000 * y_height, -1.000000 - (z_length - 1),

					-0.813645 - (x_width - 1), 0.684794 * y_height, 0.813645 + (z_length - 1),
					-0.917419 - (x_width - 1), 0.533854 * y_height, 0.917419 + (z_length - 1),
					-0.876590 - (x_width - 1), 0.623404 * y_height, 0.876590 + (z_length - 1),

					-0.813645 - (x_width - 1), 0.684794 * y_height, -0.813645 - (z_length - 1),
					-0.917419 - (x_width - 1), 0.533854 * y_height, -0.917419 - (z_length - 1),
					-0.876590 - (x_width - 1), 0.623404 * y_height, -0.876590 - (z_length - 1),

					0.813645 + (x_width - 1), 0.684794 * y_height, 0.813645 + (z_length - 1),
					0.917419 + (x_width - 1), 0.533854 * y_height, 0.917419 + (z_length - 1),
					0.876590 + (x_width - 1), 0.623404 * y_height, 0.876590 + (z_length - 1),

					0.813645 + (x_width - 1), 0.684794 * y_height, -0.813645 - (z_length - 1),
					0.917419 + (x_width - 1), 0.533854 * y_height, -0.917419 - (z_length - 1),
					0.876590 + (x_width - 1), 0.623404 * y_height, -0.876590 - (z_length - 1),

				]);
				faces = new Uint16Array([
					7, 4, 10,
					8, 3, 1,
					7, 6, 4,
					7, 9, 6,
					12, 11, 14,
					14, 11, 2,
					6, 5, 11,
					6, 11, 12,
					11, 0, 2,
					12, 14, 15,
					7, 10, 13,
					15, 14, 8,
					8, 14, 3,
					5, 8, 1,
					13, 15, 9,
					9, 8, 5,
					10, 12, 15,
					3, 2, 0,
					4, 6, 12,
					9, 5, 6,
					4, 12, 10,
					11, 5, 0,
					15, 8, 9,
					13, 9, 7,
					10, 15, 13,
					14, 2, 3,
					5, 1, 0,
					3, 0, 1,
				]);
				let geometry = new THREE.BufferGeometry();
				geometry.setIndex(new THREE.BufferAttribute(faces, 1));
				geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
				geometry.computeVertexNormals();
				return geometry;
			} else {
				/*
				vertices = new Float32Array([
					0.000000, 1.500000 + (y_height - 1.0), -1.000000,
					-0.382683, 1.500000 + (y_height - 1.0), -0.923880,
					-0.707107, 1.500000 + (y_height - 1.0), -0.707107,
					-0.923880, 1.500000 + (y_height - 1.0), -0.382683,
					-1.000000, 1.500000, 0.000000,	// Base cone vertex
					-0.923880, 1.500000 + (y_height - 1.0), 0.382683,
					-0.707107, 1.500000 + (y_height - 1.0), 0.707107,
					-0.382683, 1.500000 + (y_height - 1.0), 0.923880,
					0.000000, 1.500000 + (y_height - 1.0), 1.000000,
					0.382683, 1.500000 + (y_height - 1.0), 0.923880,
					0.707107, 1.500000 + (y_height - 1.0), 0.707107,
					0.923880, 1.500000 + (y_height - 1.0), 0.382683,
					1.000000, 1.500000, 0.000000,	// Base cone vertex
					0.923880, 1.500000 + (y_height - 1.0), -0.382683,
					0.707107, 1.500000 + (y_height - 1.0), -0.707107,
					0.382683, 1.500000 + (y_height - 1.0), -0.923880,
					0.000000, 2.000000 + (y_height - 1.0), -1.000000,
					-0.382683, 2.000000 + (y_height - 1.0), -0.923880,
					-0.707107, 2.000000 + (y_height - 1.0), -0.707107,
					-0.923880, 2.000000 + (y_height - 1.0), -0.382683,
					-1.000000, 2.000000, 0.000000,	// Base cone vertex
					-0.923880, 2.000000 + (y_height - 1.0), 0.382683,
					-0.707107, 2.000000 + (y_height - 1.0), 0.707107,
					-0.382683, 2.000000 + (y_height - 1.0), 0.923880,
					0.000000, 2.000000 + (y_height - 1.0), 1.000000,
					0.382683, 2.000000 + (y_height - 1.0), 0.923880,
					0.707107, 2.000000 + (y_height - 1.0), 0.707107,
					0.923880, 2.000000 + (y_height - 1.0), 0.382683,
					1.000000, 2.000000, 0.000000,	// Base cone vertex
					0.923880, 2.000000 + (y_height - 1.0), -0.382683,
					0.707107, 2.000000 + (y_height - 1.0), -0.707107,
					0.382683, 2.000000 + (y_height - 1.0), -0.923880,
					0.000000, 0.000000 + (y_height - 1.0), -0.200000,	// Base cone vertex (top)
					-0.141421, 0.000000 + (y_height - 1.0), -0.141421,// Base cone vertex (top)
					-0.200000, 0.000000, 0.000000,	// Base cone vertex
					-0.141421, 0.000000 + (y_height - 1.0), 0.141421,	// Base cone vertex (top)
					0.000000, 0.000000 + (y_height - 1.0), 0.200000,	// Base cone vertex (top)
					0.141421, 0.000000 + (y_height - 1.0), 0.141421,	// Base cone vertex (top)
					0.200000, 0.000000, 0.000000,	// Base cone vertex
					0.141421, 0.000000 + (y_height - 1.0), -0.141421,	// Base cone vertex (top)
					0.000000, 1.500000 + (y_height - 1.0), -0.200000,	// Base cone vertex (top)
					-0.141421, 1.500000 + (y_height - 1.0), -0.141421,// Base cone vertex (top)
					-0.200000, 1.500000, 0.000000,	// Base cone vertex
					-0.141421, 1.500000 + (y_height - 1.0), 0.141421,	// Base cone vertex (top)
					0.000000, 1.500000 + (y_height - 1.0), 0.200000,	// Base cone vertex (top)
					0.141421, 1.500000 + (y_height - 1.0), 0.141421,	// Base cone vertex (top)
					0.200000, 1.500000, 0.000000,	// Base cone vertex
					0.141421, 1.500000 + (y_height - 1.0), -0.141421,	// Base cone vertex (top)
				]);
	
				faces = new Uint16Array([
					6, 8, 7,
					8, 23, 7,
					20, 21, 22,
					12, 28, 27,
					0, 16, 31,
					15, 30, 14,
					7, 22, 6,
					14, 29, 13,
					6, 22, 21,
					30, 31, 16,
					26, 27, 28,
					9, 24, 8,
					0, 2, 1,
					8, 10, 9,
					16, 20, 24,
					1, 16, 0,
					8, 24, 23,
					18, 19, 20,
					5, 21, 20,
					2, 4, 3,
					15, 31, 30,
					28, 29, 30,
					0, 31, 15,
					9, 25, 24,
					4, 20, 19,
					0, 8, 4,
					24, 26, 28,
					16, 18, 20,
					28, 30, 16,
					3, 18, 2,
					5, 20, 4,
					7, 23, 22,
					13, 28, 12,
					22, 23, 24,
					10, 25, 9,
					14, 30, 29,
					1, 17, 16,
					24, 28, 16,
					4, 8, 6,
					2, 17, 1,
					12, 27, 11,
					16, 17, 18,
					4, 19, 3,
					14, 0, 15,
					10, 12, 11,
					8, 0, 12,
					3, 19, 18,
					24, 25, 26,
					4, 6, 5,
					10, 26, 25,
					11, 26, 10,
					13, 29, 28,
					6, 21, 5,
					12, 0, 14,
					8, 12, 10,
					0, 4, 2,
					2, 18, 17,
					20, 22, 24,
					11, 27, 26,
					12, 14, 13,
	
					36, 45, 44,
					32, 41, 40,
					37, 46, 45,
					35, 44, 43,
					34, 35, 43,
					35, 36, 44,
					36, 37, 45,
					39, 32, 40,
					32, 33, 41,
					37, 38, 46,
					33, 34, 42,
					39, 40, 47,
					33, 42, 41,
					38, 47, 46,
					38, 39, 47,
					34, 43, 42,
				]);
				*/
				// Load the gltf model for the button
				let loader = new GLTFLoader();
				let button_model;
				await loader.loadAsync(
					// resource URL
					'./3d/general/typewriter_button.gltf').then(
						// called when the resource is loaded
						function (gltf) {
							button_model = gltf.scene;
							// button_model.scale.set(0.5, 0.5, 0.5);
							// button_model.position.set(0, 0, 0);
							// button_model.rotation.set(Math.PI / 2, 0, 0);
							// button_model.traverse(function (child) {
							// 	if (child.isMesh) {
							// 		child.material = special_button_material;
							// 	}
							// });
							// button_model.name = 'typewriter_button_model';
						},
					);
				// Return the loaded geometry
				let geometry = button_model.children[0].geometry;
				return geometry;
			}
		}

		let button_material = create_material(buttons_color[selected_keyboard_version], 40, 0x181818, false);
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
			// button_material.flatShading = true;
			button_material.roughness = 0.35;
			button_material.metalness = 0.5;
		}
		let special_button_material = new THREE.MeshStandardMaterial(button_material);
		if (selected_keyboard_version == keyboard_versions.pc_keyboard) special_button_material.color = new THREE.Color(base_color[selected_keyboard_version]);
		else if (selected_keyboard_version == keyboard_versions.laptop_keyboard) special_button_material.color = new THREE.Color(buttons_color[selected_keyboard_version]);
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
			let color = new THREE.Color(buttons_color[selected_keyboard_version]);
			color.offsetHSL(0, 0, -0.12);
			special_button_material.color = color;
		}

		let bases_shininess = [
			20,
			95,
			50
		];
		let sub_base_material = create_material(base_color[selected_keyboard_version], bases_shininess[bases_shininess], 0x181818, false);

		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) sub_base_material.metalness = 0.65;

		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
			// Add the "keyboard_normal_map.png" normal map to the sub base material to get a PC case silver look
			const normal_map = new THREE.TextureLoader().load('./3d/general/keyboard_normal_map.png');
			normal_map.wrapS = THREE.ClampToEdgeWrapping;
			normal_map.wrapT = THREE.ClampToEdgeWrapping;
			normal_map.repeat.set(1, 1);
			// normal_map.rotation = Math.PI / 2;
			sub_base_material.normalMap = normal_map;
			sub_base_material.normalMapType = THREE.ObjectSpaceNormalMap;
			let normal_map_scale = 0.75;
			sub_base_material.normalScale = new THREE.Vector2(normal_map_scale, normal_map_scale);
			// sub_base_material.side = THREE.DoubleSide;
			sub_base_material.flatShading = true;
			sub_base_material.metalness = 0.7;
			sub_base_material.roughness = 0.25;
			// sub_base_material.color = new THREE.Color(0xffffff);
		} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
			sub_base_material.metalness = 0.5;
			sub_base_material.roughness = 0.1;
			// Add the metalness map
			const metalness_map = new THREE.TextureLoader().load('./3d/general/keyboard_metalness_map.png');
			metalness_map.wrapS = THREE.RepeatWrapping;
			metalness_map.wrapT = THREE.RepeatWrapping;
			// Copy the same metalness map
			metalness_map.repeat.set(3, 3);
			// normal_map.rotation = Math.PI / 2;
			sub_base_material.metalnessMap = metalness_map;
			// sub_base_material.metalnessMapType = THREE.ObjectSpaceNormalMap;
			// button_material.metalnessMap = metalness_map;
			// button_material.metalnessMapType = THREE.ObjectSpaceNormalMap;
		}
		let base_material = new THREE.MeshStandardMaterial(sub_base_material);
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) base_material.color = new THREE.Color("#d7d7d7");
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
			const metalness_map_2 = base_material.metalnessMap.clone();
			metalness_map_2.repeat.set(20, 20);
			base_material.metalnessMap = metalness_map_2;
		}

		let crab_bases_material = new THREE.MeshStandardMaterial(sub_base_material);
		crab_bases_material.color = new THREE.Color(base_color[selected_keyboard_version]);
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
			crab_bases_material.normalMap = null;
		} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
			crab_bases_material.metalness = 0.5;
			crab_bases_material.roughness = 0.3;
		}

		// Creates a set of cubes representing the computer keyboard buttons / keys
		let keyboard_keys_rows = [
			// Array.from('1234567890?'),
			Array.from('qwertyuiop'),
			Array.from('asdfghjkl'),
			Array.from('zxcvbnm^'),
			Array.from('~ '),
		];
		let in_between_space = 0.5;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) in_between_space = 0.25;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) in_between_space = 0.375;
		let button_height_scale = 1;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) button_height_scale = 0.25;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) button_height_scale = 1;
		let button_geometry = await create_keyboard_button(1, 1, button_height_scale, selected_keyboard_version == keyboard_versions.typewriter_keyboard);
		let button_scale = 1.1;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) button_scale = 1.2;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) button_scale = 1.05;
		let button_extra_y_scale = 1;
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) button_extra_y_scale = 0.65;
		button_geometry.scale(button_scale, button_scale * button_extra_y_scale, button_scale);
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
			// Translate the space button geometry down 
			let delta = 0.715;
			button_geometry.translate(0, delta, 0);
		}
		let space_button_geometry = await create_keyboard_button(5 + (in_between_space * 2 / button_scale), 1, button_height_scale);
		let space_buttn_extra_y_scale = 1;
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) space_buttn_extra_y_scale = 1.5;
		space_button_geometry.scale(button_scale, button_scale * space_buttn_extra_y_scale, button_scale);
		button_geometry.computeBoundingBox();
		let button_bounding_box = button_geometry.boundingBox;
		let keyboard_button_width = button_bounding_box.getSize(new THREE.Vector3()).x;
		let keyboard_button_length = button_bounding_box.getSize(new THREE.Vector3()).z;
		let button_height = button_bounding_box.getSize(new THREE.Vector3()).y;
		let button_offset_from_ground = button_bounding_box.min.y;
		// console.log(button_bounding_box);
		let actual_keyboard_key_width = ((keyboard_button_width * 5 + in_between_space * 4));

		// Create the base of the keyboard
		let padding = in_between_space * 2;
		keyboard_base_height = 0.875;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) keyboard_base_height = 0.385;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) keyboard_base_height = 1.25;
		let additional_width = 0;
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) additional_width = 1.125;
		keyboard_base_width = additional_width * 2 + padding + (keyboard_button_width + in_between_space) * (keyboard_keys_rows[0].length) - in_between_space * 2;
		keyboard_base_length = padding + (keyboard_button_length + in_between_space) * (keyboard_keys_rows.length) - in_between_space * 2;

		sub_base_thickness = in_between_space / 3;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) sub_base_thickness = in_between_space / 2;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) sub_base_thickness = in_between_space / 3;
		sub_base_height = 0.15;
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) sub_base_height = 0.05;

		// if (selected_keyboard_version == keyboard_versions.laptop_keyboard) in_between_space = 0;

		for (let j = 0; j < keyboard_keys_rows.length; j++) {

			let keys_row = keyboard_keys_rows[j];

			let row_height = 0;
			if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) row_height = (keyboard_keys_rows.length - j - 1) * 1.2;

			let base_x_offset = -((keyboard_button_width + in_between_space) * keys_row.length) / 2;
			let base_y_offset = keyboard_base_height + row_height;
			let base_z_offset = -((keyboard_button_length + in_between_space) * keyboard_keys_rows.length) / 2;

			for (let i = 0; i < keys_row.length; i++) {

				const key = keys_row[i];

				// const keyboard_button = create_cube(keyboard_button_width, keyboard_button_length, keyboard_button_height, button_material);
				let button_mat;
				if (key != '?' && key != '^' && key != '~') button_mat = new THREE.MeshStandardMaterial(button_material);
				else button_mat = new THREE.MeshStandardMaterial(special_button_material);
				let is_space_key = key === ' ';
				let use_special_button_material = is_space_key && selected_keyboard_version == keyboard_versions.typewriter_keyboard;
				if (use_special_button_material) {
					button_mat = new THREE.MeshStandardMaterial(special_button_material);
					button_mat.flatShading = false;
				}
				const keyboard_button = new THREE.Mesh((is_space_key ? space_button_geometry : button_geometry), button_mat);
				// Get the height of the button from its geometry
				// keyboard_button.scale.set(button_scale, button_scale, button_scale);
				keyboard_button.castShadow = true;
				keyboard_button.receiveShadow = true;
				const keyboard_button_container = new THREE.Object3D();
				let actual_x_position = base_x_offset + (keyboard_button_width + in_between_space) * (i + 0.5);
				if (keys_row.includes(' ')) {
					// Space key, which has a different width, is in the row of buttons
					// Check if the current key comes before or after the space key
					if (i < keys_row.indexOf(' ')) {
						// The current key comes before the space key
						actual_x_position -= (actual_keyboard_key_width - keyboard_button_width) / 2;
					} else if (i > keys_row.indexOf(' ')) {
						// The current key comes after the space key
						actual_x_position += (actual_keyboard_key_width - keyboard_button_width) / 2;
					} else {
						// The current key is the space key
						// Do nothing.
					}

				}
				let additional_vertical_offset = 0;
				if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) additional_vertical_offset = -0.375;
				keyboard_button_container.position.set(
					actual_x_position,
					base_y_offset - button_offset_from_ground + additional_vertical_offset,
					base_z_offset + (keyboard_button_length + in_between_space) * (j + 0.5));
				// Add the button as a child of
				keyboard_button.name = 'keyboard_button_' + key;
				keyboard_button_container.add(keyboard_button);
				// Create a sub_base of the button which is a box sìwith only the side faces (the top and bottom faces are not created)

				// Create a text geometry for the key with the given font and size and letter
				// Load the json from "./font/Arial_Regular.json"

				let is_special_char = actual_function_keys.includes(key) == false;

				if (!is_space_key) {

					let font_json = load_json('./fonts/Arial_Modified.json');
					// let font_json = load_json('./fonts/helvetiker_regular.typeface.json');
					// Font loader takes a font typeface json and creates a font object
					// NOTE: font was converted from otf to json https://gero3.github.io/facetype.js/
					let font = new FontLoader().parse(font_json);
					let button_text = key.toUpperCase();
					// if (key === '\'') button_text = '?';
					let text_height_to_set = 0.05;
					if (selected_keyboard_version == keyboard_versions.laptop_keyboard) text_height_to_set = 0.02;
					let text_geometry = new TextGeometry(button_text, {
						font: font,
						size: 0.5,
						height: text_height_to_set,
						curveSegments: 17,
						bevelEnabled: true,
						bevelThickness: 0.01,
						bevelSize: (is_special_char && key != "?" ? 0.005 : 0.01),
						bevelOffset: 0,
						bevelSegments: 2
					});
					text_geometry.computeBoundingBox();
					let text_bounding_box = text_geometry.boundingBox;
					let text_width = text_bounding_box.getSize(new THREE.Vector3()).x;
					let text_height = text_bounding_box.getSize(new THREE.Vector3()).y;
					let text_offset_from_ground = button_height;
					// console.log(text_bounding_box);
					// Create a material for the text
					let text_material = create_material(key_names_color[selected_keyboard_version], 40, 0x111111, false);
					// Create a mesh for the text
					let text_mesh = new THREE.Mesh(text_geometry, text_material);
					text_mesh.rotateX(-1 * Math.PI / 2);
					text_mesh.position.set(-1 * keyboard_button_width / 6, text_offset_from_ground, 0);
					let text_mesh_scale = button_scale * 0.8;
					text_mesh.scale.set(text_mesh_scale, text_mesh_scale, text_mesh_scale);
					text_mesh.castShadow = true;
					text_mesh.receiveShadow = false;
					// Create a container for the text

					// Display the letter on the button
					keyboard_button.add(text_mesh);
				}

				let sub_base_mat = new THREE.MeshStandardMaterial(sub_base_material);

				let sub_base_width = (is_space_key ? actual_keyboard_key_width : keyboard_button_width);
				let sub_base;
				if (selected_keyboard_version != keyboard_versions.typewriter_keyboard || is_space_key) {
					// Create the normal "4-sided" sub base
					sub_base = create_box(
						sub_base_width + sub_base_thickness * 2,
						sub_base_height,
						keyboard_button_length + sub_base_thickness * 2,
						sub_base_thickness, sub_base_mat, [true, true, false, false, false, false]);
				} else {
					// Create an empty container and append to it a simple parallelepiped
					sub_base = new THREE.Object3D();
					let actual_sub_base = create_cube(
						sub_base_width + sub_base_thickness * 2,
						sub_base_height,
						keyboard_button_length + sub_base_thickness * 2,
						sub_base_mat);
					actual_sub_base.castShadow = true;
					actual_sub_base.receiveShadow = true;
					// actual_sub_base.position.set(0, );
					actual_sub_base.name = 'actual_sub_base_' + key;
					sub_base.add(actual_sub_base);
				}
				let base_additional_y_pos = 0;
				if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) base_additional_y_pos = sub_base_height / 2;
				sub_base.position.set(0, sub_base_height / 2 + base_additional_y_pos + -1 * additional_vertical_offset, 0, 0);
				sub_base.name = 'sub_base_' + key;
				sub_base.castShadow = true;
				sub_base.receiveShadow = true;

				// If in typewriter, attach an additional base to the button base
				if (selected_keyboard_version == keyboard_versions.typewriter_keyboard && !is_space_key) {
					let additional_sub_base_mat = new THREE.MeshStandardMaterial(button_mat);
					additional_sub_base_mat.color = new THREE.Color(button_mat.color);
					additional_sub_base_mat.color.offsetHSL(0, 0, -0.05);
					additional_sub_base_mat.metalness = 0.3;
					additional_sub_base_mat.roughness = 0.6;
					let additional_base = new THREE.Mesh(button_geometry, additional_sub_base_mat);
					additional_base.position.set(0, -0.85, 0);
					// additional_base.rotateX(Math.PI);
					let scale = 0.3;
					additional_base.scale.set(scale, scale * 2.85, scale);
					additional_base.castShadow = true;
					additional_base.receiveShadow = true;
					keyboard_button_container.add(additional_base);
				}

				keyboard_button_container.add(sub_base);
				// keyboard_button_container.castShadow = true;
				// keyboard_button_container.receiveShadow = true;

				keyboard_button_container.name = 'keyboard_button_' + key + '_container';
				let keyboard_button_obj = new KeyboardButton(keyboard_button_container, key);
				keyboard_buttons.push(keyboard_button_obj);
				whole_keyboard_container.add(keyboard_button_container);
			}
			// Add 2 extra boxes which are the same as the sub_base such that they cover the sides of the keyboard for rows narrower than the first one
			let remaining_space_to_cover = keyboard_base_width - (keyboard_button_width + in_between_space) * keys_row.length;
			if (keys_row.includes(' ')) {
				// let sub_base_width = (is_space_key ? ((keyboard_button_width * 5 + in_between_space * 4)) : keyboard_button_width);
				let normal_keys = keys_row.filter(key => key != ' ').length;
				remaining_space_to_cover = keyboard_base_width - (actual_keyboard_key_width + in_between_space) - (keyboard_button_width + in_between_space) * normal_keys;
			}
			if (remaining_space_to_cover > 0.001) {
				for (let m = 0; m < 2; m++) {
					let single_rectangle_width = remaining_space_to_cover / 2;
					let size_reduce_factor = sub_base_thickness;
					if (selected_keyboard_version == keyboard_versions.laptop_keyboard) size_reduce_factor = 0;
					let sub_base = create_cube(
						single_rectangle_width - size_reduce_factor,
						sub_base_height,
						keyboard_button_length + in_between_space - size_reduce_factor,
						sub_base_material);
					// sub_base.position.set(-keyboard_base_width / 2 + single_rectangle_width / 2, -1 * sub_base_height / 2, 0);
					let x_pos = -1 * keyboard_base_width / 2 + single_rectangle_width / 2 + (keyboard_base_width - remaining_space_to_cover / 2) * m;
					sub_base.position.set(
						x_pos,
						base_y_offset + sub_base_height / 2,
						base_z_offset + (keyboard_button_length + in_between_space) * (j + 0.5));
					sub_base.name = 'sub_base_left_' + j;
					sub_base.castShadow = true;
					sub_base.receiveShadow = true;
					whole_keyboard_container.add(sub_base);
				}
			}

			// Add an extra box under all the keys, if "row_height" is greater than 0
			if (row_height > 0.001) {
				let sub_base = create_cube(
					keyboard_base_width,
					row_height,
					keyboard_button_length + in_between_space,
					sub_base_material);
				sub_base.position.set(
					0,
					keyboard_base_height + row_height / 2,
					base_z_offset + (keyboard_button_length + in_between_space) * (j + 0.5));
				sub_base.name = 'sub_base_under_' + j;
				sub_base.castShadow = true;
				sub_base.receiveShadow = true;
				whole_keyboard_container.add(sub_base);
			}
		}

		// Add the crab bases
		let base_additional_length = keyboard_base_width / num_of_crab_bases;
		let num_of_separators_segments = 3;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) num_of_separators_segments = 0;
		let keyboard_parts_in_between_space = (in_between_space / 2 + sub_base_thickness / 2) * num_of_separators_segments + in_between_space / 8;
		crab_bases_height = sub_base_height * 4;
		if (selected_keyboard_version == keyboard_versions.laptop_keyboard) crab_bases_height = sub_base_height * 2;
		else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) crab_bases_height = 5.25;
		// Add the crab bases to the keyboard
		for (let i = 0; i < num_of_crab_bases; i++) {
			let single_base_square_width = keyboard_base_width / num_of_crab_bases;
			let hue = ((i + 0.5) / num_of_crab_bases) * 360 % 360;
			let saturation = 60;
			let lightness = 60;
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
				saturation = 40;
				lightness = 40;
			} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
				saturation = 45;
				lightness = 27;
			}
			let color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
			// Add stroke to the crab base
			let stroke_thickness = sub_base_thickness * 1;
			let additional_stroke_thickness = 0;
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) additional_stroke_thickness = sub_base_thickness * 1;
			let crab_base_stroke_material = new THREE.MeshStandardMaterial(sub_base_material);
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
				crab_base_stroke_material.color = new THREE.Color(color);
				crab_base_stroke_material.normalMap = null;
			}
			additional_crab_base_height = 0;
			additional_crab_base_stroke_height = 0;
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
				additional_crab_base_height = sub_base_height / 2;
				additional_crab_base_stroke_height = 0;
			} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
				additional_crab_base_height = 0.1;
			}
			let keyboard_crab_base_stroke = create_box(
				single_base_square_width - sub_base_thickness - additional_stroke_thickness,
				sub_base_height + additional_crab_base_stroke_height,
				single_base_square_width - sub_base_thickness - additional_stroke_thickness,
				stroke_thickness,
				crab_base_stroke_material,
				[true, true, false, false, false, false]);
			let x_pos = -1 * keyboard_base_width / 2 + single_base_square_width / 2 + (single_base_square_width * i);
			let y_pos = keyboard_base_height;
			let z_pos = -1 * (keyboard_base_length / 2 + base_additional_length / 2) - keyboard_parts_in_between_space;
			keyboard_crab_base_stroke.name = 'crab_square_stroke_' + (i + 1);
			keyboard_crab_base_stroke.castShadow = true;
			keyboard_crab_base_stroke.receiveShadow = true;
			keyboard_crab_base_stroke.position.set(0, -1 * additional_crab_base_height / 2, 0);
			// Add actual base
			let new_crab_base_material = new THREE.MeshStandardMaterial(crab_bases_material);
			if (selected_keyboard_version != keyboard_versions.laptop_keyboard) new_crab_base_material.color = new THREE.Color(color);
			let keyboard_crab_base = create_cube(
				single_base_square_width - sub_base_thickness - stroke_thickness * 2 - in_between_space / 2,
				sub_base_height + additional_crab_base_height,
				single_base_square_width - sub_base_thickness - stroke_thickness * 2 - in_between_space / 2,
				new_crab_base_material);
			keyboard_crab_base.position.set(
				x_pos,
				y_pos + sub_base_height / 2 + crab_bases_height + additional_crab_base_height / 2,
				z_pos);
			keyboard_crab_base.name = 'crab_square_' + (i + 1);
			keyboard_crab_base.castShadow = true;
			keyboard_crab_base.receiveShadow = true;
			// Add the crab base and stroke to the list of crab bases
			keyboard_crab_base.add(keyboard_crab_base_stroke);
			whole_keyboard_container.add(keyboard_crab_base);
			// Add the keyboard base to the list of crab bases
			keyboard_crab_bases.push(keyboard_crab_base);
		}
		// Add a box to make the crab bases higher
		let crab_bases_box = create_cube(
			keyboard_base_width,
			crab_bases_height,
			base_additional_length,
			base_material);
		crab_bases_box.position.set(
			0,
			keyboard_base_height + crab_bases_height / 2,
			-1 * (keyboard_base_length / 2 + base_additional_length / 2) - keyboard_parts_in_between_space) - in_between_space / 4
		crab_bases_box.castShadow = true;
		crab_bases_box.receiveShadow = true;
		whole_keyboard_container.add(crab_bases_box);

		// Add the separator between the 2 keyboard parts (i.e. actual keyboard and crab bases)
		for (let i = 0; i < num_of_separators_segments; i++) {
			let separator = create_cube(
				keyboard_base_width - sub_base_thickness,
				sub_base_height,
				sub_base_thickness,
				sub_base_material);
			separator.position.set(
				0,
				keyboard_base_height + sub_base_height / 2,
				-1 * (keyboard_base_length / 2) - (sub_base_thickness / 2 + in_between_space / 2) * (i + 1) + sub_base_thickness
			);
			separator.name = 'separator_' + (i + 1);
			separator.castShadow = true;
			separator.receiveShadow = true;
			whole_keyboard_container.add(separator);
		}

		// let base_thickness = 0.2;
		const keyboard_base = create_cube(keyboard_base_width, keyboard_base_height, keyboard_base_length + base_additional_length + keyboard_parts_in_between_space, base_material);
		keyboard_base.position.set(0, keyboard_base_height / 2, -1 * base_additional_length / 2 - keyboard_parts_in_between_space / 2);
		// keyboard_base.scale.set(keyboard_base_width, keyboard_base_height, keyboard_base_length);
		keyboard_base.castShadow = true;
		keyboard_base.receiveShadow = true;
		whole_keyboard_container.add(keyboard_base);

		let additional_offset = -0.5;
		whole_keyboard_container.position.set(0, 0, base_additional_length / 2 + keyboard_parts_in_between_space / 2 + additional_offset);

		keyboard_base_length += (base_additional_length + keyboard_parts_in_between_space);

		// If the typewriter keyboard is selected, add an additional base around the normal typewriter, with only the side faces
		if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
			let around_box_layers = 12;
			for (let i = 0; i < around_box_layers; i++) {
				let base_additional_length = keyboard_base_width / num_of_crab_bases;
				let keyboard_parts_in_between_space = (in_between_space / 2 + sub_base_thickness / 2) * num_of_separators_segments + in_between_space / 8;
				let base_material = new THREE.MeshStandardMaterial(sub_base_material);
				// base_material.color = new THREE.Color("#d7d7d7");
				let around_box_thickness = 0.75;
				// let around_box_height = 3.3;
				let length_reduce_factor = keyboard_base_length / around_box_layers;
				let length = (keyboard_base_length - length_reduce_factor * i) + around_box_thickness;
				let around_base_total_additional_height = 1.5;
				let around_box_base_start_height = 2.25;
				let around_box_height = (keyboard_base_height + crab_bases_height + around_base_total_additional_height - around_box_base_start_height) / around_box_layers + (i == 0 ? around_box_base_start_height : 0);
				let keyboard_base = create_box(
					keyboard_base_width + around_box_thickness * 2,
					around_box_height,
					length,
					around_box_thickness, base_material, [true, true, false, false, true, false]);
				keyboard_base.position.set(
					0,
					around_box_height / 2 + i * around_box_height + (i != 0 ? around_box_base_start_height : 0),
					- 1 * (base_additional_length + keyboard_parts_in_between_space) / 2 - around_box_thickness / 2 + length / 2 - (keyboard_base_length + keyboard_parts_in_between_space / 2) / 2
				);
				keyboard_base.castShadow = true;
				keyboard_base.receiveShadow = true;
				whole_keyboard_container.add(keyboard_base);
			}
		}

		scene.add(whole_keyboard_container);

	}
	await create_keyboard();

	initialize_effect_canvas_animation();

	function animate_keyboard_button(keyboard_button_code, force_down = null) {
		if (!all_keys.includes(keyboard_button_code)) return;
		// Make the keyboard button with the given code move down and then up again
		let displayed_keyboard_button_code = map_pressed_key_to_displayed_keyboard_button(keyboard_button_code);
		let keyboard_button = keyboard_buttons.find(keyboard_button => keyboard_button.key === displayed_keyboard_button_code);
		if (keyboard_button) {
			let keyboard_button_state_to_set = null;
			if (force_down !== null) keyboard_button_state_to_set = force_down ? 1 : 0;
			else keyboard_button_state_to_set = keyboard_button.state == 0 ? 1 : 0;

			if (keyboard_button.state == keyboard_button_state_to_set) return;

			// Stop and remove all the active tweens on the keyboard button
			keyboard_button.active_tweens.forEach(tween => tween.stop());
			keyboard_button.active_tweens = [];

			keyboard_button.state = keyboard_button_state_to_set;

			let keyboard_button_obj = keyboard_button.object.children[0];
			let max_delta = 0.645;
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) max_delta = 0.125;
			else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
				if (keyboard_button_code === ' ') max_delta = 0.575;
			}

			let down = keyboard_button.state == 1;
			let duration = (down ? 20 : 100);
			let keyboard_button_tween = new TWEEN.Tween(keyboard_button_obj.position)
				.to({ y: (down ? -1 * max_delta : 0) }, duration);
			if (down) keyboard_button_tween.easing(TWEEN.Easing.Linear.None);
			else keyboard_button_tween.easing(TWEEN.Easing.Back.Out);
			keyboard_button_tween.start();
			// Pulse the button color
			// randomize the color based on the total number of keyboard buttons in the 360 degrees of the hue
			let scrambled_keys = "mqrstuvwxyzdalbkpkfehfigjhcjnko";
			// Shuffle the keys deterministically based on the length of the keys
			// keys = keys.split('').sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0) + keys.indexOf(b) - keys.indexOf(b)).join('');
			let col = scrambled_keys.indexOf(displayed_keyboard_button_code) * 360 / scrambled_keys.length;
			let saturation = 60;
			let lightness = 60;
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
				saturation = 67;
				lightness = 12;
			} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
				saturation = 45;
				lightness = 27;
			}
			let pulse_color = (down ? `hsl(${col}, ${saturation}%, ${lightness}%)` : buttons_color[selected_keyboard_version]);
			if (displayed_keyboard_button_code == '?' || displayed_keyboard_button_code == '^' || displayed_keyboard_button_code == '~') {
				pulse_color = (down ? buttons_color[selected_keyboard_version] : base_color[selected_keyboard_version]);
				if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
					pulse_color = (down ? "#656565" : buttons_color[selected_keyboard_version]);
				} else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
					let normal_col = new THREE.Color(buttons_color[selected_keyboard_version]);
					normal_col.offsetHSL(0, 0, -0.12);
					let col_str = "#" + normal_col.getHexString();
					pulse_color = (down ? "#cccccc" : col_str);
				}
			}
			if (displayed_keyboard_button_code == ' ') {
				if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) {
					let normal_col = new THREE.Color(buttons_color[selected_keyboard_version]);
					normal_col.offsetHSL(0, 0, -0.12);
					let col_str = "#" + normal_col.getHexString();
					pulse_color = (down ? "#cccccc" : col_str);
				} else {
					pulse_color = (down ? "#ffffff" : buttons_color[selected_keyboard_version]);
				}
			}
			let keyboard_button_color_tween = new TWEEN.Tween(keyboard_button_obj.material.color)
				.to(new THREE.Color(pulse_color), duration);
			keyboard_button_color_tween.start();
			if (!down) animate_button_base(displayed_keyboard_button_code);

			// Update the active tweens on the keyboard button
			keyboard_button.active_tweens.push(keyboard_button_tween);
			keyboard_button.active_tweens.push(keyboard_button_color_tween);
			// console.log("Setting " + displayed_keyboard_button_code + " to " + (down ? "DOWN" : "UP"));
		}
	}

	function animate_button_base(keyboard_button_code) {
		// Make the sub_base of the button change color to a white color while the button is held down or has been held down for some time
		let displayed_keyboard_button_code = map_pressed_key_to_displayed_keyboard_button(keyboard_button_code);
		let keyboard_button = keyboard_buttons.find(keyboard_button => keyboard_button.key === displayed_keyboard_button_code);
		let transition_time = 250;
		if (keyboard_button) {
			if (selected_keyboard_version != keyboard_versions.typewriter_keyboard) {
				let children_index = 1;
				// children_index = keyboard_button.object.children.length - 1;
				let keyboard_button_obj = keyboard_button.object.children[children_index];
				// console.log(keyboard_button_obj);
				for (let i = 0; i < keyboard_button_obj.children.length; i++) {
					let sub_base = keyboard_button_obj.children[i];
					let down = keyboard_button.state == 1;
					let color = (down ? new THREE.Color(sub_base_pulse_color[selected_keyboard_version]) : new THREE.Color(base_color[selected_keyboard_version]));
					let sub_base_color_tween = new TWEEN.Tween(sub_base.material.color)
						.to(color, transition_time);
					sub_base_color_tween.start();

					// Update the active tweens on the keyboard button
					keyboard_button.active_tweens.push(sub_base_color_tween);
				}
			} else {
				let sub_base = keyboard_button.object.children[keyboard_button.object.children.length - 1].children[0];
				let down = keyboard_button.state == 1;
				let color = (down ? new THREE.Color(sub_base_pulse_color[selected_keyboard_version]) : new THREE.Color(base_color[selected_keyboard_version]));
				let sub_base_color_tween = new TWEEN.Tween(sub_base.material.color)
					.to(color, transition_time);
				sub_base_color_tween.start();

				// Update the active tweens on the keyboard button
				keyboard_button.active_tweens.push(sub_base_color_tween);
			}

		}
	}

	/**
	 * @description If the "keyboard_key" is given, maps this keyboard key string (corresponding to the event.key string for a keyup or keydown JS events) to the key in the displayed keyboard.<br/>
	 * If the "keyboard_key" is null and "displayed_key" is given, maps the given "displayed_key" to the corresponding keyboard key string (i.e. reverse mapping).<br/>
	 */
	function map_pressed_key_to_displayed_keyboard_button(keyboard_key = null, displayed_key = null) {
		let maps = [
			{ keyboard_key: '\'', displayed_key: '?' },
			{ keyboard_key: 'Alt', displayed_key: '~' },
			{ keyboard_key: ',', displayed_key: '^' }
		];
		if (keyboard_key) {
			let map = maps.find(map => map.keyboard_key === keyboard_key);
			if (map) return map.displayed_key;
			else return keyboard_key;
		} else if (displayed_key) {
			let map = maps.find(map => map.displayed_key === displayed_key);
			if (map) return map.keyboard_key;
			else return displayed_key;
		}
		console.error('No key found for the given keyboard_key or displayed_key');
		return null;
	}

	function set_crab_base_as_active(index) {
		// Make the stroke of the crab base glow white
		for (let base_index = 0; base_index < keyboard_crab_bases.length; base_index++) {
			let crab_base = keyboard_crab_bases[base_index];
			let stroke_container = crab_base.children[0];
			let pulse_color = new THREE.Color(sub_base_pulse_color[selected_keyboard_version]);
			let normal_color = new THREE.Color(base_color[selected_keyboard_version]);
			let hue = ((base_index + 0.5) / num_of_crab_bases) * 360 % 360;
			let saturation = 45 - 15;
			let lightness = 45 + 5;
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
				normal_color = new THREE.Color(`hsl(${hue}, ${saturation + 15}%, ${lightness - 15}%)`);
				pulse_color = normal_color;
			}
			let color = (base_index == index ? pulse_color : normal_color);
			let stroke = stroke_container.children[0];
			let stroke_color_tween = new TWEEN.Tween(stroke.material.color)
				.to(color, 500);
			stroke_color_tween.start();
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
				let base_pulse_color = new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
				let base_normal_color = new THREE.Color(`hsl(${hue}, ${saturation + 15}%, ${lightness - 20}%)`);
				let base_color_to_set = (base_index == index ? base_pulse_color : base_normal_color);
				let base_color_tween = new TWEEN.Tween(crab_base.material.color)
					.to(base_color_to_set, 500);
				base_color_tween.start();
			}
		}
	}

	// Set selected crab base index to the central crab base
	scene.updateMatrixWorld();	// Need to update the world matrix of the scene to get the correct world position of the crab base
	selected_crab_base_index = Math.floor(keyboard_crab_bases.length / 2);

	crab_spawn_position = new THREE.Vector3(0, 0, 0).setFromMatrixPosition(keyboard_crab_bases[selected_crab_base_index].matrixWorld);
	crab_spawn_position.y = 0;
	set_crab_base_as_active(selected_crab_base_index);

	crab_base_texture_loader.load(
		'./3d/crab/Crab_Base_color_' + crab_texture_colors[selected_keyboard_version] + '.png',
		function (texture) {
			load_crab_model(texture);
		});

	function reset_crab_arm_bones(animation_time = 100, reset_position = false, reset_rotation = true, always_reset_targets_position = true) {
		let crab_parts_bones = crab_model.getObjectByName('crab_parts').skeleton.bones;
		crab_parts_bones.forEach(bone => {
			if (bone.name.startsWith('arm')) {
				let original_angle_and_position = arm_bones_original_angles_and_positions[bone.name];
				if (animation_time < 1) {
					if (reset_rotation) bone.rotation.set(original_angle_and_position.rotation.x, original_angle_and_position.rotation.y, original_angle_and_position.rotation.z);
					if (reset_position) bone.position.set(original_angle_and_position.position.x, original_angle_and_position.position.y, original_angle_and_position.position.z);
				} else {
					if (reset_rotation) {
						new TWEEN.Tween(bone.rotation)
							.to({
								x: original_angle_and_position.rotation.x,
								y: original_angle_and_position.rotation.y,
								z: original_angle_and_position.rotation.z
							}, animation_time)
							.easing(TWEEN.Easing.Quadratic.Out)
							.start();
					}
					if (reset_position || (always_reset_targets_position && bone.name.includes('target'))) {
						new TWEEN.Tween(bone.position)
							.to({
								x: original_angle_and_position.position.x,
								y: original_angle_and_position.position.y,
								z: original_angle_and_position.position.z
							}, animation_time)
							.easing(TWEEN.Easing.Quadratic.Out)
							.start();
					}
				}
			}
		});
	}

	let guitar_model_container = undefined, guitar_model = undefined;
	function load_guitar_model() {
		let loader = new GLTFLoader();
		loader.load('./3d/guitar/guitar.gltf', function (object) {
			guitar_model = object.scene;
			guitar_model.name = 'guitar_model';
			let guitar_scale = 1;
			guitar_model.scale.set(-1 * guitar_scale, guitar_scale, guitar_scale);
			guitar_model.traverse(function (child) {
				if (child.isMesh) {
					// Set child's geometry shadows
					child.castShadow = true;
					child.receiveShadow = true;
					// Set guitar's metalness
					// child.material.metalness = 0.3;
					// Set the metalness (to make object more dark)
					if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
						child.material.metalness = 0.6;
					}
				}
			});
			// Create a guitar container and parent it to the crab's left claw
			guitar_model_container = new THREE.Object3D();
			let crab_left_claw = crab_model.getObjectByName('arm_claw_bottomL');
			guitar_model.position.set(-1.6, 0.47, 0.66);
			// quickly_create_transform_controls_helper(guitar_model, "translate");
			// Add guitar to crab's left claw
			guitar_model_container.add(guitar_model);
			crab_left_claw.add(guitar_model_container);
			// Scale down guitar container
			guitar_model_container.scale.set(0, 0, 0);
		});

	}

	let piano_model_container = undefined, piano_model = undefined;
	function load_piano_model() {
		let loader = new GLTFLoader();
		loader.load('./3d/piano/piano.gltf', function (object) {
			piano_model = object.scene;
			piano_model.name = 'piano_model';
			let piano_scale = 1.385;
			let length_scale = 1;
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) length_scale = 0.9;
			if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) length_scale = 0.9;
			piano_model.scale.set(piano_scale, piano_scale * 0.985, piano_scale * length_scale);
			piano_model.traverse(function (child) {
				if (child.isMesh) {
					// Set child's geometry shadows
					child.castShadow = true;
					child.receiveShadow = true;
					// Set main piano's material color
					let material = child.material;
					let base_saturation = 70;
					let base_lightness = 62;
					if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
						base_saturation = 46;
						base_lightness = 45;
					}
					if (material.name == "Piano_Side" || material.name == "Piano_Body") {
						let color = `hsl(324, ${base_saturation}%, ${base_lightness}%)`;
						material.color = new THREE.Color(color);
						material.roughness = 0.7;
						material.metalness = 0.1;
					} else if (material.name == "Piano_Legs") {
						// let color = `hsl(324, 68%, 60%)`;
						let color = `hsl(324, ${base_saturation - 2}%, ${base_lightness - 2}%)`;
						material.color = new THREE.Color(color);
						material.roughness = 0.7;
						material.metalness = 0.1;
					}
					// Set the metalness (to make object more dark)
					if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
						child.material.metalness = 0.5;
					}
				}
			});
			// Create a piano container and add it to the scene
			piano_model_container = new THREE.Object3D();
			// let position_to_set_x = 11.6;
			let piano_crab_base = keyboard_crab_bases[keyboard_crab_bases.length - 1];
			piano_crab_base.updateMatrixWorld();
			let piano_crab_base_world_position = piano_crab_base.getWorldPosition(new THREE.Vector3());
			let piano_crab_base_bounding_box = new THREE.Box3().setFromObject(piano_crab_base);

			let position_to_set_x = piano_crab_base_world_position.x;
			let position_to_set_y = keyboard_base_height + crab_bases_height + 0.15 + additional_crab_base_height;
			let additional_z_offset = piano_scale * 1.975;
			if (selected_keyboard_version == keyboard_versions.laptop_keyboard) additional_z_offset = piano_scale * length_scale * 1.8;
			else if (selected_keyboard_version == keyboard_versions.typewriter_keyboard) additional_z_offset = piano_scale * length_scale * 1.75;
			let position_to_set_z = piano_crab_base_world_position.z - piano_crab_base_bounding_box.max.z - additional_z_offset;
			piano_model_container.position.set(position_to_set_x, position_to_set_y, position_to_set_z);

			// quickly_create_transform_conotrols_helper(piano_model, "translate");

			// piano_model.rotation.set(-1 * Math.PI / 2, 0, 0);
			// Add piano to crab's main bone
			piano_model_container.add(piano_model);
			scene.add(piano_model_container);
			// Scale down piano container
			piano_model_container.scale.set(0, 0, 0);
		});

	}

	let dj_station_model_container = undefined, dj_station_model = undefined;
	function load_dj_station_model() {
		let loader = new GLTFLoader();
		loader.load('./3d/dj_station/dj_station.gltf', function (object) {
			dj_station_model = object.scene;
			dj_station_model.name = 'dj_station_model';
			// let dj_station_scale = 0.675;
			let dj_station_scale = 1.6;
			dj_station_model.scale.set(dj_station_scale, dj_station_scale, dj_station_scale);
			dj_station_model.traverse(function (child) {
				if (child.isMesh) {
					// Set child's geometry shadows
					child.castShadow = true;
					child.receiveShadow = true;
					// Set dj_station's metalness
					child.material.metalness = 0.4;
					// Set the metalness (to make object more dark)
					if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
						child.material.metalness = 0.95;
					}
				}
			});
			// Create a dj_station container and add it to the scene
			let crab_main_bone = get_crab_main_bone();
			dj_station_model_container = new THREE.Object3D();
			dj_station_model_container.add(dj_station_model);
			let rotation_to_set = new THREE.Vector3(-30, 0, 0);
			dj_station_model.rotation.set(-1 * Math.PI / 2 + rotation_to_set.x * Math.PI / 180, Math.PI + rotation_to_set.y * Math.PI / 180, rotation_to_set.z * Math.PI / 180);
			let position_to_set = new THREE.Vector3(0, 8.125, -0.65);
			dj_station_model_container.position.set(position_to_set.x, position_to_set.y, position_to_set.z);
			// Add dj_station to crab's main bone
			crab_main_bone.add(dj_station_model_container);
			// Scale down dj_station container
			dj_station_model_container.scale.set(0, 0, 0);
		});
	}

	let bass_model_container = undefined, bass_model = undefined;
	function load_bass_model() {
		let loader = new GLTFLoader();
		loader.load('./3d/bass/bass.gltf', function (object) {
			bass_model = object.scene;
			bass_model.name = 'bass_model';
			let bass_scale = 1.475;
			bass_model.scale.set(bass_scale, bass_scale, bass_scale);
			bass_model.traverse(function (child) {
				if (child.isMesh) {
					// Set child's geometry shadows
					child.castShadow = true;
					child.receiveShadow = true;
					// Set the metalness (to make object more dark)
					if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
						child.material.metalness = 0.875;
					}
				}
			});
			// Create a bass container and add it to the scene
			// let crab_left_claw = crab_model.getObjectByName('arm_claw_bottomL');
			let crab_main_bone = get_crab_main_bone();
			bass_model_container = new THREE.Object3D();
			bass_model_container.name = 'bass_model_container';
			bass_model_container.add(bass_model);
			// let rotation_to_set = new THREE.Vector3(-0.791, 0.07, -0.324);
			// // bass_model.rotation.set(rotation_to_set.x * Math.PI / 180, rotation_to_set.y * Math.PI / 180, rotation_to_set.z * Math.PI / 180);
			// bass_model.rotation.set(rotation_to_set.x, rotation_to_set.y, rotation_to_set.z);
			let position_to_set = bass_model_container_normal_position;
			bass_model_container.position.set(position_to_set.x, position_to_set.y, position_to_set.z);
			// Add bass to crab's left claw
			crab_main_bone.add(bass_model_container);
			// Scale down bass container
			bass_model_container.scale.set(0, 0, 0);
		});
	}

	let synth_model_container = undefined, synth_model = undefined;
	function load_synth_model() {
		let loader = new GLTFLoader();
		loader.load('./3d/synth/synth.gltf', function (object) {
			synth_model = object.scene;
			synth_model.name = 'synth_model';
			let synth_scale = 0.2;
			synth_model.scale.set(synth_scale, synth_scale, synth_scale);
			synth_model.traverse(function (child) {
				if (child.isMesh) {
					// Set child's geometry shadows
					child.castShadow = true;
					child.receiveShadow = true;
					// Set the metalness (to make object more dark)
					if (selected_keyboard_version == keyboard_versions.laptop_keyboard) {
						child.material.metalness = 0.85;
					}
				}
			});
			// Create a synth container and add it to the scene
			synth_model_container = new THREE.Object3D();
			let crab_main_bone = get_crab_main_bone();
			// let crab_left_claw = crab_model.getObjectByName('arm_claw_bottomL');
			synth_model.position.set(0, 0, 0);
			// synth_model.rotation.set(Math.PI, 0, Math.PI);
			// Add synth to crab's left claw
			let rotation_to_set = new THREE.Vector3(-30, 0, 0);
			synth_model.rotation.set(Math.PI + rotation_to_set.x * Math.PI / 180, rotation_to_set.y * Math.PI / 180, Math.PI + rotation_to_set.z * Math.PI / 180);
			let position_to_set = new THREE.Vector3(0, 8.125, -0.7);
			synth_model_container.position.set(position_to_set.x, position_to_set.y, position_to_set.z);
			synth_model_container.add(synth_model);
			crab_main_bone.add(synth_model_container);
			// Scale down synth container
			synth_model_container.scale.set(0, 0, 0);
		});
	}

	function pose_crab_for_neutral_position(make_instruments_disappear = true) {

		// if (current_crab_pose == crab_poses.neutral) return;
		if (current_crab_pose == crab_poses.transitioning) return;
		current_crab_pose = crab_poses.transitioning;

		let animation_duration = pose_transition_animation_duration;
		let slightly_longer_animation_duration = animation_duration * 1.01;

		if (make_instruments_disappear) {
			// Make bass disappear and stop its animation
			if (bass_model_container.scale.y > 0.75) {
				toggle_bass(false, slightly_longer_animation_duration);
			}
			if (bass_animation_is_playing) stop_crab_bass_animation();
			// Make dj set disappear and stop its animation
			if (dj_station_model_container.scale.y > 0.75) {
				toggle_dj_station(false, slightly_longer_animation_duration);
			}
			if (dj_station_animation_is_playing) stop_crab_dj_station_animation();
			// Make guitar disappear and stop its animation
			if (guitar_model_container.scale.y > 0.75) {
				toggle_guitar(false, slightly_longer_animation_duration);
			}
			if (guitar_animation_is_playing) stop_crab_guitar_animation();
			// Make synth disappear and stop its animation
			if (synth_model_container.scale.y > 0.75) {
				toggle_synth(false, slightly_longer_animation_duration);
			}
			if (synth_animation_is_playing) stop_crab_synth_animation();
			// Make piano disappear and stop its animation
			if (piano_model_container.scale.y > 0.75) {
				toggle_piano(false, slightly_longer_animation_duration);
			}
			if (piano_animation_is_playing) stop_crab_piano_animation(true, true);
		}

		// Reset target positions as in "crab_arms_targets_original_positions"
		// let left_arm_target_position = crab_arms_targets_poses.neutral.arm_targetL;
		// let left_arm_target = get_crab_bone('arm_targetL');
		// let move_arm_tween_left = new TWEEN.Tween(left_arm_target.position)
		// 	.to(left_arm_target_position, animation_duration)
		// 	.easing(TWEEN.Easing.Quadratic.InOut)
		// move_arm_tween_left.start();
		// let right_arm_target_position = crab_arms_targets_poses.neutral.arm_targetR;
		// let right_arm_target = get_crab_bone('arm_targetR');
		// let move_arm_tween_right = new TWEEN.Tween(right_arm_target.position)
		// 	.to(right_arm_target_position, animation_duration)
		// 	.easing(TWEEN.Easing.Quadratic.InOut)
		// move_arm_tween_right.start();
		reset_crab_arm_bones(animation_duration);

		// Reset crab main bones rotation to original rotation (crab_original_main_bone_rotation)
		let crab_main_bone = get_crab_main_bone();
		let crab_main_bone_rotation = crab_original_main_bone_rotation;
		let crab_main_bone_rotation_tween = new TWEEN.Tween(crab_main_bone.rotation)
			.to({ x: crab_main_bone_rotation.x, y: crab_main_bone_rotation.y, z: crab_main_bone_rotation.z }, animation_duration)
			.easing(TWEEN.Easing.Quadratic.InOut)
		crab_main_bone_rotation_tween.start();

		// Set crab pose to neutral
		setTimeout(function () {
			current_crab_pose = crab_poses.neutral;
		}, slightly_longer_animation_duration);

	}

	function pose_crab_for_guitar(make_guitar_appear = true, force_posing = false, pose_immediatly = false) {
		if (current_crab_pose == crab_poses.guitar && !force_posing) return;
		if (current_crab_pose == crab_poses.transitioning) return;
		current_crab_pose = crab_poses.transitioning;
		let animation_duration = pose_transition_animation_duration;
		let slightly_longer_animation_duration = animation_duration * 1.01;
		// Left arm target movement
		let left_arm_target_position = crab_arms_targets_poses.guitar.arm_targetL;
		let left_arm_target = get_crab_bone('arm_targetL');
		if (!pose_immediatly) {
			let move_arm_tween_left = new TWEEN.Tween(left_arm_target.position)
				.to(left_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_left.start();
		} else {
			left_arm_target.position.set(left_arm_target_position.x, left_arm_target_position.y, left_arm_target_position.z);
		}
		// Right arm target movement
		let right_arm_target_position = crab_arms_targets_poses.guitar.arm_targetR;
		let right_arm_target = get_crab_bone('arm_targetR');
		if (!pose_immediatly) {
			let move_arm_tween_right = new TWEEN.Tween(right_arm_target.position)
				.to(right_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_right.start();
		} else {
			right_arm_target.position.set(right_arm_target_position.x, right_arm_target_position.y, right_arm_target_position.z);
		}
		// Make guitar appear and stop its animation
		if (!force_posing && make_guitar_appear) {
			toggle_guitar(true, slightly_longer_animation_duration, pose_immediatly);
		}
		// Force the guitar scale and glow to be normal
		if (force_posing) {
			// Also resets guitar scale to 1, and guitar emissive (glow) to 0 (with a tween animation)
			let guitar_final_scale = new THREE.Vector3(1, 1, 1);
			let guitar_final_glow = new THREE.Color(0x000000);
			// Scale guitar container
			if (!pose_immediatly) {
				let scale_tween = new TWEEN.Tween(guitar_model_container.scale)
					.to({ x: guitar_final_scale.x, y: guitar_final_scale.y, z: guitar_final_scale.z }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				scale_tween.start();
				// Gradually remove guitar glow
				let glow_tween = new TWEEN.Tween(guitar_model.children[0].material.emissive)
					.to({ r: guitar_final_glow.r, g: guitar_final_glow.g, b: guitar_final_glow.b }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				glow_tween.start();
			} else {
				guitar_model_container.scale.set(guitar_final_scale.x, guitar_final_scale.y, guitar_final_scale.z);
				guitar_model.children[0].material.emissive = guitar_final_glow;
			}
		}
		// Set crab pose to guitar
		setTimeout(function () {
			current_crab_pose = crab_poses.guitar;
		}, slightly_longer_animation_duration);
	}

	function pose_crab_for_piano(make_piano_appear = true, force_posing = false, pose_immediatly = false) {
		if (current_crab_pose == crab_poses.piano) return;
		if (current_crab_pose == crab_poses.transitioning) return;
		current_crab_pose = crab_poses.transitioning;
		let animation_duration = pose_transition_animation_duration;
		let slightly_longer_animation_duration = animation_duration * 1.01;
		// Left arm target movement
		let left_arm_target_position = crab_arms_targets_poses.piano.arm_targetL;
		let left_arm_target = get_crab_bone('arm_targetL');
		if (!pose_immediatly) {
			let move_arm_tween_left = new TWEEN.Tween(left_arm_target.position)
				.to(left_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_left.start();
		} else {
			left_arm_target.position.set(left_arm_target_position.x, left_arm_target_position.y, left_arm_target_position.z);
		}
		// Right arm target movement
		let right_arm_target_position = crab_arms_targets_poses.piano.arm_targetR;
		let right_arm_target = get_crab_bone('arm_targetR');
		if (!pose_immediatly) {
			let move_arm_tween_right = new TWEEN.Tween(right_arm_target.position)
				.to(right_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_right.start();
		} else {
			right_arm_target.position.set(right_arm_target_position.x, right_arm_target_position.y, right_arm_target_position.z);
		}
		// Make piano appear and stop its animation
		if (!force_posing && make_piano_appear) {
			toggle_piano(true, slightly_longer_animation_duration, pose_immediatly);
		}
		// Force the piano scale and glow to be normal
		if (force_posing) {
			// Also resets piano scale to 1, and piano emissive (glow) to 0 (with a tween animation)
			let piano_final_scale = new THREE.Vector3(1, 1, 1);
			let piano_final_glow = new THREE.Color(0x000000);
			let piano_materials = [];
			piano_model.traverse(function (child) {
				if (child.isMesh) {
					if (!piano_materials.includes(child.material)) piano_materials.push(child.material);
				}
			});
			// Scale piano container
			if (!pose_immediatly) {
				let scale_tween = new TWEEN.Tween(piano_model_container.scale)
					.to({ x: piano_final_scale.x, y: piano_final_scale.y, z: piano_final_scale.z }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				scale_tween.start();
				// Gradually remove piano glow (for all the materials of all the piano meshes)

				piano_materials.forEach(material => {
					let glow_tween = new TWEEN.Tween(material.emissive)
						.to({ r: piano_final_glow.r, g: piano_final_glow.g, b: piano_final_glow.b }, animation_duration)
						.easing(TWEEN.Easing.Quadratic.InOut)
					glow_tween.start();
				});
			} else {
				piano_model_container.scale.set(piano_final_scale.x, piano_final_scale.y, piano_final_scale.z);
				piano_materials.forEach(material => {
					material.emissive = piano_final_glow;
				});
			}
		}
		// Set crab pose to piano
		setTimeout(function () {
			current_crab_pose = crab_poses.piano;
		}, slightly_longer_animation_duration);
	}

	function pose_crab_for_dj_station(make_dj_station_appear = true, force_posing = false, pose_immediatly = false) {
		if (current_crab_pose == crab_poses.dj_station) return;
		if (current_crab_pose == crab_poses.transitioning) return;
		current_crab_pose = crab_poses.transitioning;
		let animation_duration = pose_transition_animation_duration;
		let slightly_longer_animation_duration = animation_duration * 1.01;
		// Left arm target movement
		let left_arm_target_position = crab_arms_targets_poses.dj_station.arm_targetL;
		let left_arm_target = get_crab_bone('arm_targetL');
		if (!pose_immediatly) {
			let move_arm_tween_left = new TWEEN.Tween(left_arm_target.position)
				.to(left_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_left.start();
		} else {
			left_arm_target.position.set(left_arm_target_position.x, left_arm_target_position.y, left_arm_target_position.z);
		}
		// Right arm target movement
		let right_arm_target_position = crab_arms_targets_poses.dj_station.arm_targetR;
		let right_arm_target = get_crab_bone('arm_targetR');
		if (!pose_immediatly) {
			let move_arm_tween_right = new TWEEN.Tween(right_arm_target.position)
				.to(right_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_right.start();
		} else {
			right_arm_target.position.set(right_arm_target_position.x, right_arm_target_position.y, right_arm_target_position.z);
		}
		// Make dj_station appear and stop its animation
		if (!force_posing && make_dj_station_appear) {
			toggle_dj_station(true, slightly_longer_animation_duration, pose_immediatly);
		}
		// Force the dj_station scale, glow and position to be normal
		if (force_posing) {
			// Also resets dj_station scale to 1, and dj_station emissive (glow) to 0 (with a tween animation)
			let dj_station_final_scale = new THREE.Vector3(1, 1, 1);
			let dj_station_final_glow = new THREE.Color(0x000000);
			// Scale dj_station container
			if (!pose_immediatly) {
				let scale_tween = new TWEEN.Tween(dj_station_model_container.scale)
					.to({ x: dj_station_final_scale.x, y: dj_station_final_scale.y, z: dj_station_final_scale.z }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				scale_tween.start();
				// Gradually remove dj_station glow
				let glow_tween = new TWEEN.Tween(dj_station_model.children[0].material.emissive)
					.to({ r: dj_station_final_glow.r, g: dj_station_final_glow.g, b: dj_station_final_glow.b }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				glow_tween.start();
				// Reset dj_station position (of dj_station_model, not its container)
				let dj_station_final_position = new THREE.Vector3(0, 0, 0);
				let position_tween = new TWEEN.Tween(dj_station_model.position)
					.to({ x: dj_station_final_position.x, y: dj_station_final_position.y, z: dj_station_final_position.z }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				position_tween.start();
			} else {
				dj_station_model_container.scale.set(dj_station_final_scale.x, dj_station_final_scale.y, dj_station_final_scale.z);
				dj_station_model.children[0].material.emissive = dj_station_final_glow;
				dj_station_model.position.set(0, 0, 0);
			}

		}
		// Set crab pose to dj_station
		setTimeout(function () {
			current_crab_pose = crab_poses.dj_station;
		}, slightly_longer_animation_duration);
	}

	// Do the same as the previous function, but for the synth
	function pose_crab_for_synth(make_synth_appear = true, force_posing = false, pose_immediatly = false) {
		if (current_crab_pose == crab_poses.synth) return;
		if (current_crab_pose == crab_poses.transitioning) return;
		current_crab_pose = crab_poses.transitioning;
		let animation_duration = pose_transition_animation_duration;
		let slightly_longer_animation_duration = animation_duration * 1.01;
		// Left arm target movement
		let left_arm_target_position = crab_arms_targets_poses.synth.arm_targetL;
		let left_arm_target = get_crab_bone('arm_targetL');
		if (!pose_immediatly) {
			let move_arm_tween_left = new TWEEN.Tween(left_arm_target.position)
				.to(left_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_left.start();
		} else {
			left_arm_target.position.set(left_arm_target_position.x, left_arm_target_position.y, left_arm_target_position.z);
		}
		// Right arm target movement
		let right_arm_target_position = crab_arms_targets_poses.synth.arm_targetR;
		let right_arm_target = get_crab_bone('arm_targetR');
		if (!pose_immediatly) {
			let move_arm_tween_right = new TWEEN.Tween(right_arm_target.position)
				.to(right_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_right.start();
		} else {
			right_arm_target.position.set(right_arm_target_position.x, right_arm_target_position.y, right_arm_target_position.z);
		}
		// Make synth appear and stop its animation
		if (!force_posing && make_synth_appear) {
			toggle_synth(true, slightly_longer_animation_duration, pose_immediatly);
		}
		// Force the synth scale, glow and position to be normal
		if (force_posing) {
			// Also resets synth scale to 1, and synth emissive (glow) to 0 (with a tween animation)
			let synth_final_scale = new THREE.Vector3(1, 1, 1);
			let synth_final_glow = new THREE.Color(0x000000);
			// Scale synth container
			if (!pose_immediatly) {
				let scale_tween = new TWEEN.Tween(synth_model_container.scale)
					.to({ x: synth_final_scale.x, y: synth_final_scale.y, z: synth_final_scale.z }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				scale_tween.start();
				// Gradually remove synth glow
				let glow_tween = new TWEEN.Tween(synth_model.children[0].material.emissive)
					.to({ r: synth_final_glow.r, g: synth_final_glow.g, b: synth_final_glow.b }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				glow_tween.start();
				// Reset synth position (of synth_model, not its container)
				let synth_final_position = new THREE.Vector3(0, 0, 0);
				let position_tween = new TWEEN.Tween(synth_model.position)
					.to({ x: synth_final_position.x, y: synth_final_position.y, z: synth_final_position.z }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				position_tween.start();
			} else {
				synth_model_container.scale.set(synth_final_scale.x, synth_final_scale.y, synth_final_scale.z);
				synth_model.children[0].material.emissive = synth_final_glow;
				synth_model.position.set(0, 0, 0);
			}
		}
		// Set crab pose to synth
		setTimeout(function () {
			current_crab_pose = crab_poses.synth;
		}, slightly_longer_animation_duration);
	}

	function pose_crab_for_bass(make_bass_appear = true, force_posing = false, pose_immediatly = false) {
		if (current_crab_pose == crab_poses.bass) return;
		if (current_crab_pose == crab_poses.transitioning) return;
		current_crab_pose = crab_poses.transitioning;
		let animation_duration = pose_transition_animation_duration;
		let slightly_longer_animation_duration = animation_duration * 1.01;
		// Left arm target movement
		let left_arm_target_position = crab_arms_targets_poses.bass.arm_targetL;
		let left_arm_target = get_crab_bone('arm_targetL');
		if (!pose_immediatly) {
			let move_arm_tween_left = new TWEEN.Tween(left_arm_target.position)
				.to(left_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_left.start();
		} else {
			left_arm_target.position.set(left_arm_target_position.x, left_arm_target_position.y, left_arm_target_position.z);
		}
		// Right arm target movement
		let right_arm_target_position = crab_arms_targets_poses.bass.arm_targetR;
		let right_arm_target = get_crab_bone('arm_targetR');
		if (!pose_immediatly) {
			let move_arm_tween_right = new TWEEN.Tween(right_arm_target.position)
				.to(right_arm_target_position, animation_duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			move_arm_tween_right.start();
		} else {
			right_arm_target.position.set(right_arm_target_position.x, right_arm_target_position.y, right_arm_target_position.z);
		}
		// Rotate crab main bone for bass pose
		let crab_main_bone = get_crab_main_bone();
		let crab_main_bone_rotation = new THREE.Vector3(1.227, -0.002, -0.011);
		let crab_main_bone_rotation_tween = new TWEEN.Tween(crab_main_bone.rotation)
			.to({ x: crab_main_bone_rotation.x, y: crab_main_bone_rotation.y, z: crab_main_bone_rotation.z }, animation_duration)
			.easing(TWEEN.Easing.Quadratic.InOut)
		crab_main_bone_rotation_tween.start();
		// Make bass appear and stop its animation
		if (!force_posing && make_bass_appear) {
			toggle_bass(true, slightly_longer_animation_duration, pose_immediatly);
		}
		// Force the bass scale, glow and position to be normal
		if (force_posing) {
			// Also resets bass scale to 1, and bass emissive (glow) to 0 (with a tween animation)
			let bass_final_scale = new THREE.Vector3(1, 1, 1);
			let bass_final_glow = new THREE.Color(0x000000);
			// Scale bass container
			if (!pose_immediatly) {
				let scale_tween = new TWEEN.Tween(bass_model_container.scale)
					.to({ x: bass_final_scale.x, y: bass_final_scale.y, z: bass_final_scale.z }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				scale_tween.start();
				// Gradually remove bass glow
				let glow_tween = new TWEEN.Tween(bass_model.children[0].material.emissive)
					.to({ r: bass_final_glow.r, g: bass_final_glow.g, b: bass_final_glow.b }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				glow_tween.start();
				// Reset bass position (of bass_model, not its container)
				let bass_final_position = new THREE.Vector3(0, 0, 0);
				let position_tween = new TWEEN.Tween(bass_model.position)
					.to({ x: bass_final_position.x, y: bass_final_position.y, z: bass_final_position.z }, animation_duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				position_tween.start();
			} else {
				bass_model_container.scale.set(bass_final_scale.x, bass_final_scale.y, bass_final_scale.z);
				bass_model.children[0].material.emissive = bass_final_glow;
				bass_model.position.set(0, 0, 0);
			}
		}
		// Set crab pose to bass
		setTimeout(function () {
			current_crab_pose = crab_poses.bass;
		}, slightly_longer_animation_duration);
	}

	let started_loading_instruments = false;

	function load_all_instruments_models() {
		if (started_loading_instruments) return;
		started_loading_instruments = true;
		load_guitar_model();
		load_piano_model();
		load_dj_station_model();
		load_bass_model();
		load_synth_model();
	}

	/**
	 * @description Debug function used to execute another "callback" function as soon as the scene is ready (i.e. when "scene_is_ready" is true)
	 */
	function debug_execute_callback_after_scene_is_ready(callback) {
		if (!scene_is_ready) {
			setTimeout(() => {
				debug_execute_callback_after_scene_is_ready(callback);
			}, 250);
		} else {
			callback();
		}
	}

	function get_instrument_model_container(instrument_number) {
		let instrument_name = Object.keys(instruments)[instrument_number - 1];
		let instrument_model_container = undefined;
		switch (instrument_name) {
			case "bass":
				instrument_model_container = bass_model_container;
				break;
			case "dj_station":
				instrument_model_container = dj_station_model_container;
				break;
			case "guitar":
				instrument_model_container = guitar_model_container;
				break;
			case "synth":
				instrument_model_container = synth_model_container;
				break;
			case "piano":
				instrument_model_container = piano_model_container;
				break;
		}
		return instrument_model_container;
	}
	function get_instrument_model(instrument_number) {
		let instrument_name = Object.keys(instruments)[instrument_number - 1];
		let instrument_model = undefined;
		switch (instrument_name) {
			case "bass":
				instrument_model = bass_model;
				break;
			case "dj_station":
				instrument_model = dj_station_model;
				break;
			case "guitar":
				instrument_model = guitar_model;
				break;
			case "synth":
				instrument_model = synth_model;
				break;
			case "piano":
				instrument_model = piano_model;
				break;
		}
		return instrument_model;
	}

	function toggle_instrument(instrument_number, activate, duration, toggle_immediatly = false) {
		let start_scale;
		let start_glow;
		let end_scale;
		let end_glow;
		let instrument_name = Object.keys(instruments)[instrument_number - 1];
		if (activate) {
			// Spawn instrument
			start_scale = instruments_start_scale[instrument_name].clone();
			start_glow = new THREE.Color(0xffffff);
			end_scale = new THREE.Vector3(1, 1, 1);
			end_glow = new THREE.Color(0x000000);
			instruments_are_on_screen[instrument_name] = true;
		} else {
			// Make instrument disappear
			start_scale = new THREE.Vector3(1, 1, 1);
			start_glow = new THREE.Color(0x000000);
			end_scale = instruments_start_scale[instrument_name].clone();
			end_glow = new THREE.Color(0xffffff);
			instruments_are_on_screen[instrument_name] = false;
		}
		// Scale instrument container
		if (!toggle_immediatly) {
			let instrument_model_container = get_instrument_model_container(instrument_number);
			instrument_model_container.scale.set(start_scale.x, start_scale.y, start_scale.z);
			let instrument_scale_tween = new TWEEN.Tween(instrument_model_container.scale)
				.to({ x: end_scale.x, y: end_scale.y, z: end_scale.z }, duration)
				.easing(TWEEN.Easing.Quadratic.InOut)
			instrument_scale_tween.start();
		} else {
			let instrument_model_container = get_instrument_model_container(instrument_number);
			instrument_model_container.scale.set(end_scale.x, end_scale.y, end_scale.z);
		}
		// Get the materials of the object itself and of all its children (if any, with no duplicateds)
		let instrument_model = get_instrument_model(instrument_number);
		let instrument_materials = [];
		instrument_model.traverse(function (child) {
			if (child.isMesh) {
				if (!instrument_materials.includes(child.material)) instrument_materials.push(child.material);
			}
		});
		if (instrument_model.material != undefined) {
			if (!instrument_materials.includes(instrument_model.material)) instrument_materials.push(instrument_model.material);
		}
		// Gradually add/remove instrument glow
		if (!toggle_immediatly) {
			// Gradually remove instrument glow (for all the materials of all the instrument meshes)
			instrument_materials.forEach(material => {
				material.emissive = start_glow;
				let instrument_glow_tween = new TWEEN.Tween(material.emissive)
					.to({ r: end_glow.r, g: end_glow.g, b: end_glow.b }, duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
				instrument_glow_tween.start();
			});
		} else {
			instrument_materials.forEach(material => {
				material.emissive = end_glow;
			});
		}
		// Snap the model position to 0 (for only certain instruments)
		if (activate) {
			if (instrument_name == "dj_station") {
				instrument_model.position.set(0, 0, 0);
			}
		}
	}

	let guitar_model_container_normal_rotation = new THREE.Vector3(0, -20.25, 18);
	function force_face_guitar_model_in_front(set_to_normal_rotation = true) {
		// console.log("forcing guitar rotation to be front faced");
		if (guitar_model_container == undefined || !instruments_are_on_screen.guitar) return;
		let parent_global_rotation = guitar_model_container.parent.getWorldQuaternion(new THREE.Quaternion());
		parent_global_rotation.invert();
		guitar_model_container.setRotationFromQuaternion(parent_global_rotation);
		if (set_to_normal_rotation) {
			guitar_model_container.rotation.x += guitar_model_container_normal_rotation.x * (Math.PI / 180);
			guitar_model_container.rotation.y += guitar_model_container_normal_rotation.y * (Math.PI / 180);
			guitar_model_container.rotation.z += guitar_model_container_normal_rotation.z * (Math.PI / 180);
		}
	}

	let bass_model_container_normal_position = new THREE.Vector3(1.027, 4.318, -1.033);
	let bass_model_container_normal_rotation = new THREE.Vector3(-1.596, -0.237, -0.164);
	function force_face_bass_model_in_front(set_to_normal_rotation = true, maintain_anchored_to_ground = true) {
		// Force bass rotation
		if (bass_model_container == undefined || !instruments_are_on_screen.bass) return;
		let parent_global_rotation = bass_model_container.parent.getWorldQuaternion(new THREE.Quaternion());
		parent_global_rotation.invert();
		bass_model_container.setRotationFromQuaternion(parent_global_rotation);
		if (set_to_normal_rotation) {
			bass_model_container.rotation.x = bass_model_container_normal_rotation.x;
			bass_model_container.rotation.y = bass_model_container_normal_rotation.y;
			bass_model_container.rotation.z = bass_model_container_normal_rotation.z;
		}
		// Force bass to stay anchored to the ground, by considering the delta to its original position
		if (maintain_anchored_to_ground) {
			// Maintain the same y position from the ground
			let crab_main_bone = get_crab_main_bone();
			let crab_main_bone_height = crab_main_bone.position.y;
			let crab_main_bone_height_delta = crab_main_bone_height - crab_original_main_bone_height;
			let height_delta_multiplier = -1;
			bass_model_container.position.z = bass_model_container_normal_position.z - crab_main_bone_height_delta * height_delta_multiplier;
			// Rotate the bass left and right based on the the crab main bone x position
			let rotation_multiplier = 2;
			let rotation_factor_positive = -0.25;	// Crab is moving on his left
			let rotation_factor_negative = -0.2;	// Crab is moving on his right
			let max_crab_idle_horizontal_delta = 0.35;
			// Get crab x position with respect to crab base with index 0 position
			// let crab_main_bone_x = crab_main_bone.position.x;
			let bass_crab_base_world_position = keyboard_crab_bases[0].getWorldPosition(new THREE.Vector3());
			let crab_main_bone_world_position = crab_main_bone.getWorldPosition(new THREE.Vector3());
			let crab_main_bone_x = crab_main_bone_world_position.x - bass_crab_base_world_position.x;
			if (crab_main_bone_x > max_crab_idle_horizontal_delta) crab_main_bone_x = max_crab_idle_horizontal_delta;
			if (crab_main_bone_x < -1 * max_crab_idle_horizontal_delta) crab_main_bone_x = -1 * max_crab_idle_horizontal_delta;
			// console.log("crab_main_bone_world_position.x: " + crab_main_bone_world_position.x);
			// console.log("bass_crab_base_world_position.x: " + bass_crab_base_world_position.x);
			// console.log("crab_main_bone_x: " + crab_main_bone_x);
			let rotation_factor = crab_main_bone_x > 0 ? rotation_factor_positive : rotation_factor_negative;
			bass_model_container.rotation.z = bass_model_container_normal_rotation.z + (crab_main_bone_x * rotation_factor) * rotation_multiplier;
			// console.log("bass_model_container.rotation.z: " + bass_model_container.rotation.z);
		}
	}

	let crab_guitar_move_arm_tween_up_right, crab_guitar_move_arm_tween_down_right,
		crab_guitar_move_arm_tween_up_left, crab_guitar_move_arm_tween_down_left,
		guitar_scale_tween_up, guitar_scale_tween_down,
		guitar_glow_tween_up, guitar_glow_tween_down;
	let guitar_animation_is_playing = false;
	function start_crab_guitar_animation() {
		if (guitar_animation_is_playing || current_crab_pose != crab_poses.guitar) return;
		guitar_animation_is_playing = true;
		let animation_duration = 1000 * beat_duration / 8;
		// Move the crab's right arm up and down by a certain amount on loop
		let arm_delta_up_right = 0.5;
		let arm_delta_down_right = 0;
		let right_arm_target = get_crab_bone('arm_targetR');
		let right_arm_normal_position = crab_arms_targets_poses.guitar.arm_targetR;
		let right_arm_target_position_up = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z + arm_delta_up_right);
		let right_arm_target_position_down = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z - arm_delta_down_right);
		crab_guitar_move_arm_tween_up_right = new TWEEN.Tween(right_arm_target.position)
			.to(right_arm_target_position_up, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_guitar_move_arm_tween_down_right = new TWEEN.Tween(right_arm_target.position)
			.to(right_arm_target_position_down, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_guitar_move_arm_tween_up_right.chain(crab_guitar_move_arm_tween_down_right);
		crab_guitar_move_arm_tween_down_right.chain(crab_guitar_move_arm_tween_up_right);
		crab_guitar_move_arm_tween_up_right.start();
		// Move crab's left arm up and down by certain deltas on loop
		let arm_delta_up_left = 0.15;
		let arm_delta_down_left = 0;
		let left_arm_target = get_crab_bone('arm_targetL');
		let left_arm_normal_position = crab_arms_targets_poses.guitar.arm_targetL;
		let left_arm_target_position_up = new THREE.Vector3(left_arm_normal_position.x, left_arm_normal_position.y, left_arm_normal_position.z + arm_delta_up_left);
		let left_arm_target_position_down = new THREE.Vector3(left_arm_normal_position.x, left_arm_normal_position.y, left_arm_normal_position.z - arm_delta_down_left);
		crab_guitar_move_arm_tween_up_left = new TWEEN.Tween(left_arm_target.position)
			.to(left_arm_target_position_up, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_guitar_move_arm_tween_down_left = new TWEEN.Tween(left_arm_target.position)
			.to(left_arm_target_position_down, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_guitar_move_arm_tween_up_left.chain(crab_guitar_move_arm_tween_down_left);
		crab_guitar_move_arm_tween_down_left.chain(crab_guitar_move_arm_tween_up_left);
		crab_guitar_move_arm_tween_up_left.start();
		// Pulse the guitar (emissive) to glow on loop gradually (i.e. from 0 to a certain amount and back to 0)
		let glow_color = new THREE.Color(0.15, 0.15, 0.15);
		let material = guitar_model.children[0].material;
		guitar_glow_tween_up = new TWEEN.Tween(material.emissive)
			.to({ r: glow_color.r, g: glow_color.g, b: glow_color.b }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		guitar_glow_tween_down = new TWEEN.Tween(material.emissive)
			.to({ r: 0, g: 0, b: 0 }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		guitar_glow_tween_up.chain(guitar_glow_tween_down);
		guitar_glow_tween_down.chain(guitar_glow_tween_up);
		guitar_glow_tween_up.start();
		// Also scale the guitar up and down by a certain delta
		let scale_delta = 0.05;
		let guitar_scale_up = new THREE.Vector3(1 + scale_delta, 1 + scale_delta, 1 + scale_delta);
		let guitar_scale_down = new THREE.Vector3(1, 1, 1);
		guitar_scale_tween_up = new TWEEN.Tween(guitar_model_container.scale)
			.to({ x: guitar_scale_up.x, y: guitar_scale_up.y, z: guitar_scale_up.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		guitar_scale_tween_down = new TWEEN.Tween(guitar_model_container.scale)
			.to({ x: guitar_scale_down.x, y: guitar_scale_down.y, z: guitar_scale_down.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		guitar_scale_tween_up.chain(guitar_scale_tween_down);
		guitar_scale_tween_down.chain(guitar_scale_tween_up);
		guitar_scale_tween_up.start();
	}
	function stop_crab_guitar_animation(reset_pose_for_guitar = false, reset_immediatly = false) {
		if (!guitar_animation_is_playing) return;
		guitar_animation_is_playing = false;
		crab_guitar_move_arm_tween_up_right.stop();
		crab_guitar_move_arm_tween_down_right.stop();
		crab_guitar_move_arm_tween_up_left.stop();
		crab_guitar_move_arm_tween_down_left.stop();
		guitar_scale_tween_up.stop();
		guitar_scale_tween_down.stop();
		guitar_glow_tween_up.stop();
		guitar_glow_tween_down.stop();
		if (reset_pose_for_guitar) {
			if (reset_immediatly) {
				pose_crab_for_guitar(true, true, true);
			} else {
				pose_crab_for_guitar(false, true);
			}
		}
	}

	function toggle_guitar(activate, duration, toggle_immediatly = false) {
		toggle_instrument(instruments.guitar, activate, duration, toggle_immediatly);
	}

	let crab_bass_move_arm_tween_up, crab_bass_move_arm_tween_down,
		bass_scale_tween_up, bass_scale_tween_down,
		bass_glow_tween_up, bass_glow_tween_down;
	let bass_animation_is_playing = false;
	function start_crab_bass_animation() {
		if (bass_animation_is_playing || current_crab_pose != crab_poses.bass) return;
		bass_animation_is_playing = true;
		let animation_duration = 1000 * beat_duration / 4;
		// Move the crab's right arm up and down by a certain amount on loop
		let arm_delta_up = 0.55;
		let arm_delta_down = 0;
		let right_arm_target = get_crab_bone('arm_targetR');
		let right_arm_normal_position = crab_arms_targets_poses.bass.arm_targetR;
		let right_arm_target_position_up = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z + arm_delta_up);
		let right_arm_target_position_down = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z - arm_delta_down);
		crab_bass_move_arm_tween_up = new TWEEN.Tween(right_arm_target.position)
			.to(right_arm_target_position_up, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_bass_move_arm_tween_down = new TWEEN.Tween(right_arm_target.position)
			.to(right_arm_target_position_down, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_bass_move_arm_tween_up.chain(crab_bass_move_arm_tween_down);
		crab_bass_move_arm_tween_down.chain(crab_bass_move_arm_tween_up);
		crab_bass_move_arm_tween_up.start();
		// Pulse the bass (emissive) to glow on loop gradually (i.e. from 0 to a certain amount and back to 0)
		let glow_color = new THREE.Color(0.15, 0.15, 0.15);
		let material = bass_model.children[0].material;
		bass_glow_tween_up = new TWEEN.Tween(material.emissive)
			.to({ r: glow_color.r, g: glow_color.g, b: glow_color.b }, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		bass_glow_tween_down = new TWEEN.Tween(material.emissive)
			.to({ r: 0, g: 0, b: 0 }, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		bass_glow_tween_up.chain(bass_glow_tween_down);
		bass_glow_tween_down.chain(bass_glow_tween_up);
		bass_glow_tween_up.start();
		// Also scale the bass up and down by a certain delta
		let scale_delta = 0.0625;
		let bass_scale_up = new THREE.Vector3(1 + scale_delta, 1 + scale_delta, 1 + scale_delta);
		let bass_scale_down = new THREE.Vector3(1, 1, 1);
		bass_scale_tween_up = new TWEEN.Tween(bass_model_container.scale)
			.to({ x: bass_scale_up.x, y: bass_scale_up.y, z: bass_scale_up.z }, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		bass_scale_tween_down = new TWEEN.Tween(bass_model_container.scale)
			.to({ x: bass_scale_down.x, y: bass_scale_down.y, z: bass_scale_down.z }, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		bass_scale_tween_up.chain(bass_scale_tween_down);
		bass_scale_tween_down.chain(bass_scale_tween_up);
		bass_scale_tween_up.start();
	}
	function stop_crab_bass_animation(reset_pose_for_bass = false, reset_immediatly = false) {
		if (!bass_animation_is_playing) return;
		bass_animation_is_playing = false;
		crab_bass_move_arm_tween_up.stop();
		crab_bass_move_arm_tween_down.stop();
		bass_scale_tween_up.stop();
		bass_scale_tween_down.stop();
		bass_glow_tween_up.stop();
		bass_glow_tween_down.stop();
		if (reset_pose_for_bass) {
			if (reset_immediatly) {
				pose_crab_for_bass(true, true, true);
			} else {
				pose_crab_for_bass(false, true);
			}
		}
	}

	function toggle_bass(activate, duration, toggle_immediatly = false) {
		toggle_instrument(instruments.bass, activate, duration, toggle_immediatly);
	}

	let piano_animation_arm_tween_up_right, piano_animation_arm_tween_down_right, piano_animation_arm_tween_side_right, piano_animation_arm_tween_center_right,
		piano_animation_arm_tween_up_left, piano_animation_arm_tween_down_left, piano_animation_arm_tween_side_left, piano_animation_arm_tween_center_left,
		piano_scale_tween_up, piano_scale_tween_down,
		piano_glow_tween_up, piano_glow_tween_down;
	let piano_animation_is_playing = false;
	function start_crab_piano_animation() {
		if (piano_animation_is_playing || current_crab_pose != crab_poses.piano) return;
		piano_animation_is_playing = true;
		let animation_duration = 1000 * beat_duration / 4;
		// Move the crab's right arm up and down by a certain amount on loop
		let arm_delta_up_right = 0.65;
		let arm_delta_down_right = 0;
		let right_arm_target = get_crab_bone('arm_targetR');
		let right_arm_normal_position = crab_arms_targets_poses.piano.arm_targetR;
		let right_arm_target_position_up = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z + arm_delta_up_right);
		let right_arm_target_position_down = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z - arm_delta_down_right);
		piano_animation_arm_tween_up_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				// x: right_arm_target_position_up.x,
				y: right_arm_target_position_up.y,
				// z: right_arm_target_position_up.z
			}, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_animation_arm_tween_down_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				// x: right_arm_target_position_down.x,
				y: right_arm_target_position_down.y,
				// z: right_arm_target_position_down.z
			}, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_animation_arm_tween_up_right.chain(piano_animation_arm_tween_down_right);
		piano_animation_arm_tween_down_right.chain(piano_animation_arm_tween_up_right);
		piano_animation_arm_tween_up_right.start();
		// Move crab's left arm up and down by certain deltas on loop
		let arm_delta_up_left = 0.15;
		let arm_delta_down_left = 0;
		let left_arm_target = get_crab_bone('arm_targetL');
		let left_arm_normal_position = crab_arms_targets_poses.piano.arm_targetL;
		let left_arm_target_position_up = new THREE.Vector3(left_arm_normal_position.x, left_arm_normal_position.y, left_arm_normal_position.z + arm_delta_up_left);
		let left_arm_target_position_down = new THREE.Vector3(left_arm_normal_position.x, left_arm_normal_position.y, left_arm_normal_position.z - arm_delta_down_left);
		piano_animation_arm_tween_up_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				// x: left_arm_target_position_up.x,
				y: left_arm_target_position_up.y,
				// z: left_arm_target_position_up.z
			}, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_animation_arm_tween_down_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				// x: left_arm_target_position_down.x,
				y: left_arm_target_position_down.y,
				// z: left_arm_target_position_down.z
			}, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_animation_arm_tween_up_left.chain(piano_animation_arm_tween_down_left);
		piano_animation_arm_tween_down_left.chain(piano_animation_arm_tween_up_left);
		piano_animation_arm_tween_up_left.start();
		// Move the right arm also left and right (on x axis), from center to a certain side delta, on loop
		let arm_delta_side = 0.65;
		let right_arm_target_position_side = new THREE.Vector3(right_arm_normal_position.x - arm_delta_side, right_arm_normal_position.y, right_arm_normal_position.z);
		piano_animation_arm_tween_side_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				x: right_arm_target_position_side.x,
				// y: right_arm_target_position_side.y,
				// z: right_arm_target_position_side.z
			}, animation_duration * 4)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_animation_arm_tween_center_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				x: right_arm_normal_position.x,
				// y: right_arm_normal_position.y,
				// z: right_arm_normal_position.z
			}, animation_duration * 4)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_animation_arm_tween_side_right.chain(piano_animation_arm_tween_center_right);
		piano_animation_arm_tween_center_right.chain(piano_animation_arm_tween_side_right);
		piano_animation_arm_tween_side_right.start();
		// Move the left arm also left and right (on x axis), from center to a certain side delta, on loop
		let left_arm_target_position_side = new THREE.Vector3(left_arm_normal_position.x + arm_delta_side, left_arm_normal_position.y, left_arm_normal_position.z);
		piano_animation_arm_tween_side_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				x: left_arm_target_position_side.x,
				// y: left_arm_target_position_side.y,
				// z: left_arm_target_position_side.z
			}, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_animation_arm_tween_center_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				x: left_arm_normal_position.x,
				// y: left_arm_normal_position.y,
				// z: left_arm_normal_position.z
			}, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_animation_arm_tween_side_left.chain(piano_animation_arm_tween_center_left);
		piano_animation_arm_tween_center_left.chain(piano_animation_arm_tween_side_left);
		piano_animation_arm_tween_side_left.start();
		// Pulse the piano (emissive) to glow on loop gradually (i.e. from 0 to a certain amount and back to 0)
		let glow_color = new THREE.Color(0.15, 0.15, 0.15);
		let piano_materials = [];
		piano_model.traverse(function (child) {
			if (child.isMesh) {
				if (!piano_materials.includes(child.material)) piano_materials.push(child.material);
			}
		});
		piano_glow_tween_up = new TWEEN.Tween(piano_materials[0].emissive)
			.to({ r: glow_color.r, g: glow_color.g, b: glow_color.b }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_glow_tween_down = new TWEEN.Tween(piano_materials[0].emissive)
			.to({ r: 0, g: 0, b: 0 }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_glow_tween_up.chain(piano_glow_tween_down);
		piano_glow_tween_down.chain(piano_glow_tween_up);
		piano_glow_tween_up.start();
		// Also scale the piano up and down by a certain delta
		let scale_delta = 0.025;
		let piano_scale_up = new THREE.Vector3(1 + scale_delta, 1 + scale_delta, 1 + scale_delta);
		let piano_scale_down = new THREE.Vector3(1, 1, 1);
		piano_scale_tween_up = new TWEEN.Tween(piano_model_container.scale)
			.to({ x: piano_scale_up.x, y: piano_scale_up.y, z: piano_scale_up.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_scale_tween_down = new TWEEN.Tween(piano_model_container.scale)
			.to({ x: piano_scale_down.x, y: piano_scale_down.y, z: piano_scale_down.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		piano_scale_tween_up.chain(piano_scale_tween_down);
		piano_scale_tween_down.chain(piano_scale_tween_up);
		piano_scale_tween_up.start();
	}
	function stop_crab_piano_animation(reset_pose_for_piano = false, reset_immediatly = false) {
		if (!piano_animation_is_playing) return;
		piano_animation_is_playing = false;
		piano_animation_arm_tween_up_right.stop();
		piano_animation_arm_tween_down_right.stop();
		piano_animation_arm_tween_side_right.stop();
		piano_animation_arm_tween_center_right.stop();
		piano_animation_arm_tween_up_left.stop();
		piano_animation_arm_tween_down_left.stop();
		piano_animation_arm_tween_side_left.stop();
		piano_animation_arm_tween_center_left.stop();
		piano_scale_tween_up.stop();
		piano_scale_tween_down.stop();
		piano_glow_tween_up.stop();
		piano_glow_tween_down.stop();
		if (reset_pose_for_piano) {
			if (reset_immediatly) {
				pose_crab_for_piano(true, true, true);
			} else {
				pose_crab_for_piano(false, true);
			}
		}
	}

	function toggle_piano(activate, duration, toggle_immediatly = false) {
		toggle_instrument(instruments.piano, activate, duration, toggle_immediatly);
	}

	let crab_dj_station_move_arm_tween_up_right, crab_dj_station_move_arm_tween_down_right, crab_dj_station_move_arm_tween_side_right, crab_dj_station_move_arm_tween_center_right,
		crab_dj_station_move_arm_tween_up_left, crab_dj_station_move_arm_tween_down_left, crab_dj_station_move_arm_tween_side_left, crab_dj_station_move_arm_tween_center_left,
		dj_station_scale_tween_up, dj_station_scale_tween_down,
		dj_station_move_up, dj_station_move_down,
		dj_station_glow_tween_up, dj_station_glow_tween_down;
	let dj_station_animation_is_playing = false;
	function start_crab_dj_station_animation() {
		if (dj_station_animation_is_playing || current_crab_pose != crab_poses.dj_station) return;
		dj_station_animation_is_playing = true;
		let animation_duration = 1000 * beat_duration / 4;
		// Move the crab's right arm up and down by a certain amount on loop
		let arm_delta_up_right = 0.65;
		let arm_delta_down_right = 0;
		let right_arm_target = get_crab_bone('arm_targetR');
		let right_arm_normal_position = crab_arms_targets_poses.dj_station.arm_targetR;
		let right_arm_target_position_up = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z + arm_delta_up_right);
		let right_arm_target_position_down = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z - arm_delta_down_right);
		crab_dj_station_move_arm_tween_up_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				// x: right_arm_target_position_up.x,
				y: right_arm_target_position_up.y,
				// z: right_arm_target_position_up.z
			}, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_dj_station_move_arm_tween_down_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				// x: right_arm_target_position_down.x,
				y: right_arm_target_position_down.y,
				// z: right_arm_target_position_down.z
			}, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_dj_station_move_arm_tween_up_right.chain(crab_dj_station_move_arm_tween_down_right);
		crab_dj_station_move_arm_tween_down_right.chain(crab_dj_station_move_arm_tween_up_right);
		crab_dj_station_move_arm_tween_up_right.start();
		// Move crab's left arm up and down by certain deltas on loop
		let arm_delta_up_left = 0.25;
		let arm_delta_down_left = 0;
		let left_arm_target = get_crab_bone('arm_targetL');
		let left_arm_normal_position = crab_arms_targets_poses.dj_station.arm_targetL;
		let left_arm_target_position_up = new THREE.Vector3(left_arm_normal_position.x, left_arm_normal_position.y, left_arm_normal_position.z + arm_delta_up_left);
		let left_arm_target_position_down = new THREE.Vector3(left_arm_normal_position.x, left_arm_normal_position.y, left_arm_normal_position.z - arm_delta_down_left);
		crab_dj_station_move_arm_tween_up_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				// x: left_arm_target_position_up.x,
				y: left_arm_target_position_up.y,
				// z: left_arm_target_position_up.z
			}, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_dj_station_move_arm_tween_down_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				// x: left_arm_target_position_down.x,
				y: left_arm_target_position_down.y,
				// z: left_arm_target_position_down.z
			}, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_dj_station_move_arm_tween_up_left.chain(crab_dj_station_move_arm_tween_down_left);
		crab_dj_station_move_arm_tween_down_left.chain(crab_dj_station_move_arm_tween_up_left);
		crab_dj_station_move_arm_tween_up_left.start();
		// Move the right arm also left and right (on x axis), from center to a certain side delta, on loop
		let arm_delta_side = 0.375;
		let right_arm_target_position_side = new THREE.Vector3(right_arm_normal_position.x - arm_delta_side, right_arm_normal_position.y, right_arm_normal_position.z);
		crab_dj_station_move_arm_tween_side_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				x: right_arm_target_position_side.x,
				// y: right_arm_target_position_side.y,
				// z: right_arm_target_position_side.z
			}, animation_duration * 8)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_dj_station_move_arm_tween_center_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				x: right_arm_normal_position.x,
				// y: right_arm_normal_position.y,
				// z: right_arm_normal_position.z
			}, animation_duration * 8)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_dj_station_move_arm_tween_side_right.chain(crab_dj_station_move_arm_tween_center_right);
		crab_dj_station_move_arm_tween_center_right.chain(crab_dj_station_move_arm_tween_side_right);
		crab_dj_station_move_arm_tween_side_right.start();
		// Move the left arm also left and right (on x axis), from center to a certain side delta, on loop
		let left_arm_target_position_side = new THREE.Vector3(left_arm_normal_position.x + arm_delta_side, left_arm_normal_position.y, left_arm_normal_position.z);
		crab_dj_station_move_arm_tween_side_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				x: left_arm_target_position_side.x,
				// y: left_arm_target_position_side.y,
				// z: left_arm_target_position_side.z
			}, animation_duration * 4)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_dj_station_move_arm_tween_center_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				x: left_arm_normal_position.x,
				// y: left_arm_normal_position.y,
				// z: left_arm_normal_position.z
			}, animation_duration * 4)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_dj_station_move_arm_tween_side_left.chain(crab_dj_station_move_arm_tween_center_left);
		crab_dj_station_move_arm_tween_center_left.chain(crab_dj_station_move_arm_tween_side_left);
		crab_dj_station_move_arm_tween_side_left.start();
		// Pulse the dj station (emissive) to glow on loop gradually (i.e. from 0 to a certain amount and back to 0)
		let glow_color = new THREE.Color(0.1, 0.6, 0.1);
		let dj_station_materials = [];
		dj_station_model.traverse(function (child) {
			if (child.isMesh) {
				if (!dj_station_materials.includes(child.material)) dj_station_materials.push(child.material);
			}
		});
		dj_station_glow_tween_up = new TWEEN.Tween(dj_station_materials[0].emissive)
			.to({ r: glow_color.r, g: glow_color.g, b: glow_color.b }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		dj_station_glow_tween_down = new TWEEN.Tween(dj_station_materials[0].emissive)
			.to({ r: 0, g: 0, b: 0 }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		dj_station_glow_tween_up.chain(dj_station_glow_tween_down);
		dj_station_glow_tween_down.chain(dj_station_glow_tween_up);
		dj_station_glow_tween_up.start();
		// Move dj station up and down by a certain amount on loop
		let dj_station_delta_up = 0.375;
		let dj_station_delta_down = 0;
		let dj_station_normal_position = new THREE.Vector3(0, 0, 0);
		let dj_station_position_up = new THREE.Vector3(dj_station_normal_position.x, dj_station_normal_position.y + dj_station_delta_up, dj_station_normal_position.z + dj_station_delta_up / 2);
		let dj_station_position_down = new THREE.Vector3(dj_station_normal_position.x, dj_station_normal_position.y - dj_station_delta_down, dj_station_normal_position.z);
		dj_station_move_up = new TWEEN.Tween(dj_station_model.position)
			.to({ x: dj_station_position_up.x, y: dj_station_position_up.y, z: dj_station_position_up.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		dj_station_move_down = new TWEEN.Tween(dj_station_model.position)
			.to({ x: dj_station_position_down.x, y: dj_station_position_down.y, z: dj_station_position_down.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		dj_station_move_up.chain(dj_station_move_down);
		dj_station_move_down.chain(dj_station_move_up);
		dj_station_move_up.start();
		// Also scale the dj station up and down by a certain delta
		let scale_delta = 0.065;
		let dj_station_scale_up = new THREE.Vector3(1 + scale_delta, 1 + scale_delta, 1 + scale_delta);
		let dj_station_scale_down = new THREE.Vector3(1, 1, 1);
		dj_station_scale_tween_up = new TWEEN.Tween(dj_station_model_container.scale)
			.to({ x: dj_station_scale_up.x, y: dj_station_scale_up.y, z: dj_station_scale_up.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		dj_station_scale_tween_down = new TWEEN.Tween(dj_station_model_container.scale)
			.to({ x: dj_station_scale_down.x, y: dj_station_scale_down.y, z: dj_station_scale_down.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		dj_station_scale_tween_up.chain(dj_station_scale_tween_down);
		dj_station_scale_tween_down.chain(dj_station_scale_tween_up);
		dj_station_scale_tween_up.start();
	}
	function stop_crab_dj_station_animation(reset_pose_for_dj_station = false, reset_immediatly = false) {
		if (!dj_station_animation_is_playing) return;
		dj_station_animation_is_playing = false;
		crab_dj_station_move_arm_tween_up_right.stop();
		crab_dj_station_move_arm_tween_down_right.stop();
		crab_dj_station_move_arm_tween_side_right.stop();
		crab_dj_station_move_arm_tween_center_right.stop();
		crab_dj_station_move_arm_tween_up_left.stop();
		crab_dj_station_move_arm_tween_down_left.stop();
		crab_dj_station_move_arm_tween_side_left.stop();
		crab_dj_station_move_arm_tween_center_left.stop();
		dj_station_scale_tween_up.stop();
		dj_station_scale_tween_down.stop();
		dj_station_move_up.stop();
		dj_station_move_down.stop();
		dj_station_glow_tween_up.stop();
		dj_station_glow_tween_down.stop();
		if (reset_pose_for_dj_station) {
			if (reset_immediatly) {
				pose_crab_for_dj_station(true, true, true);
			} else {
				pose_crab_for_dj_station(false, true);
			}
		}
	}

	function toggle_dj_station(activate, duration, toggle_immediatly = false) {
		toggle_instrument(instruments.dj_station, activate, duration, toggle_immediatly);
	}

	let crab_synth_move_arm_tween_up_right, crab_synth_move_arm_tween_down_right, crab_synth_move_arm_tween_side_right, crab_synth_move_arm_tween_center_right,
		crab_synth_move_arm_tween_up_left, crab_synth_move_arm_tween_down_left, crab_synth_move_arm_tween_side_left, crab_synth_move_arm_tween_center_left,
		synth_scale_tween_up, synth_scale_tween_down,
		synth_move_up, synth_move_down,
		synth_glow_tween_up, synth_glow_tween_down;
	let synth_animation_is_playing = false;
	function start_crab_synth_animation() {
		if (synth_animation_is_playing || current_crab_pose != crab_poses.synth) return;
		synth_animation_is_playing = true;
		let animation_duration = 1000 * beat_duration / 8;
		// Move the crab's right arm up and down by a certain amount on loop
		let arm_delta_up_right = 1.65;
		let arm_delta_down_right = 0;
		let right_arm_target = get_crab_bone('arm_targetR');
		let right_arm_normal_position = crab_arms_targets_poses.synth.arm_targetR;
		let right_arm_target_position_up = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z + arm_delta_up_right);
		let right_arm_target_position_down = new THREE.Vector3(right_arm_normal_position.x, right_arm_normal_position.y, right_arm_normal_position.z - arm_delta_down_right);
		crab_synth_move_arm_tween_up_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				// x: right_arm_target_position_up.x,
				y: right_arm_target_position_up.y,
				// z: right_arm_target_position_up.z
			}, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_synth_move_arm_tween_down_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				// x: right_arm_target_position_down.x,
				y: right_arm_target_position_down.y,
				// z: right_arm_target_position_down.z
			}, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_synth_move_arm_tween_up_right.chain(crab_synth_move_arm_tween_down_right);
		crab_synth_move_arm_tween_down_right.chain(crab_synth_move_arm_tween_up_right);
		crab_synth_move_arm_tween_up_right.start();
		// Move crab's left arm up and down by certain deltas on loop
		let arm_delta_up_left = 1.65;
		let arm_delta_down_left = 0;
		let left_arm_target = get_crab_bone('arm_targetL');
		let left_arm_normal_position = crab_arms_targets_poses.synth.arm_targetL;
		let left_arm_target_position_up = new THREE.Vector3(left_arm_normal_position.x, left_arm_normal_position.y, left_arm_normal_position.z + arm_delta_up_left);
		let left_arm_target_position_down = new THREE.Vector3(left_arm_normal_position.x, left_arm_normal_position.y, left_arm_normal_position.z - arm_delta_down_left);
		crab_synth_move_arm_tween_up_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				// x: left_arm_target_position_up.x,
				y: left_arm_target_position_up.y,
				// z: left_arm_target_position_up.z
			}, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_synth_move_arm_tween_down_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				// x: left_arm_target_position_down.x,
				y: left_arm_target_position_down.y,
				// z: left_arm_target_position_down.z
			}, animation_duration)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_synth_move_arm_tween_up_left.chain(crab_synth_move_arm_tween_down_left);
		crab_synth_move_arm_tween_down_left.chain(crab_synth_move_arm_tween_up_left);
		crab_synth_move_arm_tween_up_left.start();
		// Move the right arm also left and right (on x axis), from center to a certain side delta, on loop
		let arm_delta_side = 0.425;
		let right_arm_target_position_side = new THREE.Vector3(right_arm_normal_position.x - arm_delta_side, right_arm_normal_position.y, right_arm_normal_position.z);
		crab_synth_move_arm_tween_side_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				x: right_arm_target_position_side.x,
				// y: right_arm_target_position_side.y,
				// z: right_arm_target_position_side.z
			}, animation_duration * 8)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_synth_move_arm_tween_center_right = new TWEEN.Tween(right_arm_target.position)
			.to({
				x: right_arm_normal_position.x,
				// y: right_arm_normal_position.y,
				// z: right_arm_normal_position.z
			}, animation_duration * 8)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_synth_move_arm_tween_side_right.chain(crab_synth_move_arm_tween_center_right);
		crab_synth_move_arm_tween_center_right.chain(crab_synth_move_arm_tween_side_right);
		crab_synth_move_arm_tween_side_right.start();
		// Move the left arm also left and right (on x axis), from center to a certain side delta, on loop
		let left_arm_target_position_side = new THREE.Vector3(left_arm_normal_position.x + arm_delta_side, left_arm_normal_position.y, left_arm_normal_position.z);
		crab_synth_move_arm_tween_side_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				x: left_arm_target_position_side.x,
				// y: left_arm_target_position_side.y,
				// z: left_arm_target_position_side.z
			}, animation_duration * 4)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_synth_move_arm_tween_center_left = new TWEEN.Tween(left_arm_target.position)
			.to({
				x: left_arm_normal_position.x,
				// y: left_arm_normal_position.y,
				// z: left_arm_normal_position.z
			}, animation_duration * 4)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		crab_synth_move_arm_tween_side_left.chain(crab_synth_move_arm_tween_center_left);
		crab_synth_move_arm_tween_center_left.chain(crab_synth_move_arm_tween_side_left);
		crab_synth_move_arm_tween_side_left.start();
		// Pulse the synth (emissive) to glow on loop gradually (i.e. from 0 to a certain amount and back to 0)
		let glow_color = new THREE.Color(0.15, 0.15, 0.15);
		let synth_materials = [];
		synth_model.traverse(function (child) {
			if (child.isMesh) {
				if (!synth_materials.includes(child.material)) synth_materials.push(child.material);
			}
		});
		synth_glow_tween_up = new TWEEN.Tween(synth_materials[0].emissive)
			.to({ r: glow_color.r, g: glow_color.g, b: glow_color.b }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		synth_glow_tween_down = new TWEEN.Tween(synth_materials[0].emissive)
			.to({ r: 0, g: 0, b: 0 }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		synth_glow_tween_up.chain(synth_glow_tween_down);
		synth_glow_tween_down.chain(synth_glow_tween_up);
		synth_glow_tween_up.start();
		// Move synth up and down by a certain amount on loop
		let synth_delta_up = 0.25;
		let synth_delta_down = 0;
		let synth_normal_position = new THREE.Vector3(0, 0, 0);
		let synth_position_up = new THREE.Vector3(synth_normal_position.x, synth_normal_position.y + synth_delta_up, synth_normal_position.z + synth_delta_up / 2);
		let synth_position_down = new THREE.Vector3(synth_normal_position.x, synth_normal_position.y - synth_delta_down, synth_normal_position.z);
		synth_move_up = new TWEEN.Tween(synth_model.position)
			.to({ x: synth_position_up.x, y: synth_position_up.y, z: synth_position_up.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		synth_move_down = new TWEEN.Tween(synth_model.position)
			.to({ x: synth_position_down.x, y: synth_position_down.y, z: synth_position_down.z }, animation_duration * 2)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		synth_move_up.chain(synth_move_down);
		synth_move_down.chain(synth_move_up);
		synth_move_up.start();
		// Also scale the synth up and down by a certain delta
		let scale_delta = 0.05;
		let synth_scale_up = new THREE.Vector3(1 + scale_delta, 1 + scale_delta, 1 + scale_delta);
		let synth_scale_down = new THREE.Vector3(1, 1, 1);
		synth_scale_tween_up = new TWEEN.Tween(synth_model_container.scale)
			.to({ x: synth_scale_up.x, y: synth_scale_up.y, z: synth_scale_up.z }, animation_duration * 4)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		synth_scale_tween_down = new TWEEN.Tween(synth_model_container.scale)
			.to({ x: synth_scale_down.x, y: synth_scale_down.y, z: synth_scale_down.z }, animation_duration * 4)
			.easing(TWEEN.Easing.Sinusoidal.InOut)
		synth_scale_tween_up.chain(synth_scale_tween_down);
		synth_scale_tween_down.chain(synth_scale_tween_up);
		synth_scale_tween_up.start();
	}
	function stop_crab_synth_animation(reset_pose_for_synth = false, reset_immediatly = false) {
		if (!synth_animation_is_playing) return;
		synth_animation_is_playing = false;
		crab_synth_move_arm_tween_up_right.stop();
		crab_synth_move_arm_tween_down_right.stop();
		crab_synth_move_arm_tween_side_right.stop();
		crab_synth_move_arm_tween_center_right.stop();
		crab_synth_move_arm_tween_up_left.stop();
		crab_synth_move_arm_tween_down_left.stop();
		crab_synth_move_arm_tween_side_left.stop();
		crab_synth_move_arm_tween_center_left.stop();
		synth_scale_tween_up.stop();
		synth_scale_tween_down.stop();
		synth_move_up.stop();
		synth_move_down.stop();
		synth_glow_tween_up.stop();
		synth_glow_tween_down.stop();
		if (reset_pose_for_synth) {
			if (reset_immediatly) {
				pose_crab_for_synth(true, true, true);
			} else {
				pose_crab_for_synth(false, true);
			}
		}
	}

	function toggle_synth(activate, duration, toggle_immediatly = false) {
		toggle_instrument(instruments.synth, activate, duration, toggle_immediatly);
	}

	function focus_camera(focus_on_crab = false, animation_time = 1000) {
		// When "focus_on_crab" is true, focus the camera on the crab with a tween animation, otherwise focus the caera on the center of the screen with the original camera zoom
		// Use the target of the orbit controls to focus the camera
		if (focus_on_crab) {
			let crab_position = get_crab_main_bone().getWorldPosition(new THREE.Vector3());
			let camera_position = camera.getWorldPosition(new THREE.Vector3());
			let camera_to_crab_vector = new THREE.Vector3(crab_position.x - camera_position.x, crab_position.y - camera_position.y, crab_position.z - camera_position.z).normalize();
			let view_distance_from_crab = 22.5;
			let final_camera_position = new THREE.Vector3(crab_position.x - camera_to_crab_vector.x * view_distance_from_crab, crab_position.y - camera_to_crab_vector.y * view_distance_from_crab, crab_position.z - camera_to_crab_vector.z * view_distance_from_crab);
			let target_tween = new TWEEN.Tween(controls.target)
				.to({ x: crab_position.x, y: crab_position.y, z: crab_position.z }, animation_time)
				.easing(TWEEN.Easing.Sinusoidal.InOut)
			target_tween.start();
			// Translate the camera position to maintain the original camera rotation around the controls target 
			let camera_position_tween = new TWEEN.Tween(camera.position)
				.to({ x: final_camera_position.x, y: final_camera_position.y, z: final_camera_position.z }, animation_time)
				.easing(TWEEN.Easing.Sinusoidal.InOut)
			camera_position_tween.start();
		} else {
			// Reset camera and controls target positions to original values
			let target_tween = new TWEEN.Tween(controls.target)
				.to({ x: normal_controls_target_position.x, y: normal_controls_target_position.y, z: normal_controls_target_position.z }, animation_time)
				.easing(TWEEN.Easing.Sinusoidal.InOut)
			target_tween.start();
			let camera_position_tween = new TWEEN.Tween(camera.position)
				.to({ x: camera_start_position.x, y: camera_start_position.y, z: camera_start_position.z }, animation_time)
				.easing(TWEEN.Easing.Sinusoidal.InOut)
			camera_position_tween.start();
		}
	}

	// Debug functions used to quickly create control helpers and focus on objects
	function quickly_create_transform_controls_helper(object, mode = "translate") {
		let transform_helper = new TransformControls(camera, renderer.domElement);
		transform_helper.attach(object);
		transform_helper.setMode(mode);
		transform_helper.addEventListener('change', function () {
			// Print position and rotation (each component should be rounded to only 3 decimal places)
			console.log("(" + object.name + ") object position: (" + Math.round(object.position.x * 1000) / 1000 + ", " + Math.round(object.position.y * 1000) / 1000 + ", " + Math.round(object.position.z * 1000) / 1000 + ")");
			console.log("(" + object.name + ") object rotation: (" + Math.round(object.rotation.x * 1000) / 1000 + ", " + Math.round(object.rotation.y * 1000) / 1000 + ", " + Math.round(object.rotation.z * 1000) / 1000 + ")");
		});
		transform_helper.addEventListener('dragging-changed', function (event) {
			controls.enabled = !event.value;
		});
		scene.add(transform_helper);
		return transform_helper;
	}
	function quickly_focus_camera_on_object(object) {
		// Set a timeout to focus the camera on the object
		setTimeout(function () {
			let object_position = object.getWorldPosition(new THREE.Vector3());
			controls.target.set(object_position.x, object_position.y, object_position.z);
			controls.update();
		}, 250);
	}

	//Debug function used to print the bones and their parents in a hierarchical structure
	function print_crab_bones_hieracy() {

		// Print the bones of the skeleton, with the respective skeleton bone index before it, in a tree like structure
		let skeleton = crab_model.getObjectByName('crab_parts').skeleton;
		let bones = skeleton.bones;

		// Build the tree like structure (consider that each bone has a "parent" property which is the index of the parent bone in the skeleton)
		let bones_tree = [];
		bones.forEach((bone, ind) => {
			let bone_obj = {
				name: bone.name,
				parent: bone.parent.name,
				index: ind,
				children: []
			};
			bones_tree.push(bone_obj);
		});

		// Add the children to each bone
		bones_tree.forEach(bone => {
			let parent = bone.parent;
			let bones_tree_obj = bones_tree.find(bone_obj => bone_obj.name === parent);
			if (parent != -1 && bones_tree_obj != undefined) {
				bones_tree.find(bone_obj => bone_obj.name === parent).children.push(bone);
			}
		});

		// Print the tree like structure
		function build_bones_tree_string(bone, level = 0) {
			let str = '';
			str += bone.index + ": ";
			for (let i = 0; i < level; i++) {
				str += '    ';
			}
			str += bone.name + " (parent: " + bone.parent + ")";
			console.log(str);
			// string += str + "\n";
			bone.children.forEach(child => {
				build_bones_tree_string(child, level + 1);
			});
		}
		build_bones_tree_string(bones_tree[0], 0);

	}

	// Move the crab to the given position in the given time (pass position as world position)
	// Returns the total time of the movement
	function move_crab(world_position, affects_crab_idle = true) {

		if (crab_model == undefined || crab_model == null || moving_crab) return;

		// Move crab's root bone (i.e. "body_back")
		let body_back = get_crab_main_bone();

		// Calculate the local position so that after moving the body back to this local position the body back's world position is equal to the given world position
		let root_bone = get_crab_bone('root');
		let position = root_bone.worldToLocal(world_position.clone());

		moving_crab = true;
		if (affects_crab_idle) stop_crab_idle(false);

		// Reset crab heigth to original height
		// body_back.position.set(body_back.position.x, crab_original_main_bone_height, body_back.position.z);

		function move_crab_vertically(delta, time) {
			let crab_height_tween = new TWEEN.Tween(body_back.position)
				.to({
					// x: body_back.position.x,
					y: crab_original_main_bone_height + delta,
					// z: body_back.position.z
				}, time)
			crab_height_tween.easing(TWEEN.Easing.Sinusoidal.InOut);
			crab_height_tween.start();
		}

		let height_delta = 0.1;

		// Compute the delta between the given position and the crab's body_back bone world position
		// scene.updateMatrixWorld();
		let position_delta = position.clone().sub(body_back.position);

		let move_direction = position_delta.clone().normalize();

		let animation_time = 1000 * position_delta.length() / crab_movement_speed;

		// Before moving, move crab lower based on the given delta
		move_crab_vertically(-1 * height_delta, Math.min(250, animation_time / 3));

		let crab_move_tween_x = new TWEEN.Tween(body_back.position)
			.to({
				x: position.x,
				// y: body_back.position.y + position_delta.y,
				z: position.z
			}, animation_time)
			.onUpdate(function () {
				update_legs_targets(move_direction);
			})
			.onComplete(function () {
				update_legs_targets(move_direction, true);
				// Reset crab's vertical position
				move_crab_vertically(height_delta, Math.min(200, animation_time / 3));
				// Stop crab movement
				moving_crab = false;
			});
		// crab_move_tween.easing(TWEEN.Easing.Sinusoidal.InOut);
		crab_move_tween_x.start();

		// // Move the crab's legs targets too
		// for (let leg_name in crab_legs_targets) {
		// 	let leg_target_position = crab_legs_targets[leg_name];
		// 	leg_target_position.add(position_delta);
		// }

		return animation_time;

	}

	function start_crab_idle() {
		playing_idle = true;
		refresh_crab_idle();
		// Override each tween at their start
		crab_idle_tween_up_left.stop();
		crab_idle_tween_down_center.stop();
		crab_idle_tween_up_right.stop();
		crab_idle_tween_down_center_2.stop();
		// Start tweens
		idle_flag = !idle_flag;
		if (idle_flag) crab_idle_tween_up_left.start();
		else crab_idle_tween_up_right.start();
		// console.log("Starting crab idle");
	}
	function stop_crab_idle(back_to_original_position = true) {
		playing_idle = false;
		// Stop each tween
		crab_idle_tween_up_left.stop();
		crab_idle_tween_down_center.stop();
		crab_idle_tween_up_right.stop();
		crab_idle_tween_down_center_2.stop();
		// Move crab back to original position
		if (back_to_original_position) {

			let body_back = get_crab_main_bone();

			// central position should be the mean of current legs targets position with an y equal to the crab's body_back bone original height
			let central_position = new THREE.Vector3(0, 0, 0);
			for (let leg_name in crab_legs_targets_original_positions) {
				let leg_target_position = crab_model.getObjectByName(leg_name).position;
				let pos_to_add = leg_target_position.clone().sub(original_legs_offset_from_body_back_bone[leg_name]);
				central_position.add(pos_to_add); 1
			}
			central_position.divideScalar(Object.keys(crab_legs_targets_original_positions).length);
			central_position.y = crab_original_main_bone_height;

			let time = beat_duration * 1000 / 4;
			let crab_back_to_center = new TWEEN.Tween(body_back.position)
				.to({
					x: central_position.x,
					y: central_position.y,
					z: central_position.z
				}, time)
				.easing(TWEEN.Easing.Sinusoidal.InOut);
			// crab_back_to_center.delay(100);
			crab_back_to_center.start();

			// console.log("Moving crab's position back to normal");
		}
	}

	let leg_movement_sound_1 = getAudioSource('sounds/crab_walk_1.wav')
	let leg_movement_sound_2 = getAudioSource('sounds/crab_walk_2.wav')

	// Check if the opposite leg is grounded
	function check_can_move_leg(leg_name) {
		let opposite_leg_name = leg_name.slice(0, -1) + (leg_name.endsWith("R") ? "L" : "R");
		if (crab_legs_state[opposite_leg_name].grounded) {
			// Opposite leg is grounded
			// Check which leg was moved more times (moves the leg that was moved less times)
			let moved_counter_difference = crab_legs_state[leg_name].moved_times - crab_legs_state[opposite_leg_name].moved_times;
			if (moved_counter_difference <= 0) {
				return true;
			} else {
				return false;
			}
		} else {
			// Opposite leg is NOT grounded, cannot move this leg
			return false;
		}
	}

	function set_leg_grounded(leg_name, can_move) {
		let times_moved = crab_legs_state[leg_name].moved_times;
		if (!can_move) times_moved += 1;
		crab_legs_state[leg_name] = {
			grounded: can_move,
			moved_times: times_moved
		};
	}

	// Returns true or false for alternating legs (e.g. for "leg_front_targetL" returns true, for "leg_front_targetR" returns false)
	// NOTE: Avoids alternating only between left and right legs, i.e. all left being true and all right being false
	function get_leg_alternate(leg_name) {
		switch (leg_name) {
			case "leg_front_targetL":
			case "leg_mid_front_targetR":
			case "leg_mid_back_targetL":
			case "leg_back_targetR":
				return true;
			case "leg_front_targetR":
			case "leg_mid_front_targetL":
			case "leg_mid_back_targetR":
			case "leg_back_targetL":
				return false;
		}
		return false;
	}

	function update_legs_targets(movement_direction = null, force_update = false) {
		// Max distance after which the leg should move
		let max_distance = 0.675;
		let max_square_distance = max_distance * max_distance;
		// Additional distance added to the movement direction
		let additional_distance = 0.625;
		// Set crab leg movement time
		let movement_time = 1000 * (max_distance + additional_distance) / (2 * crab_movement_speed);
		// Cycle through all the legs targets
		for (let leg_name in crab_legs_targets_original_positions) {
			// Position of the current leg target
			let leg_target_position = crab_legs_targets_original_positions[leg_name];
			// What the actual position of the leg should be given the bodys leg
			let current_body_leg_position = crab_model.getObjectByName('body_back').position.clone();
			current_body_leg_position.setY(crab_original_main_bone_height);
			current_body_leg_position = current_body_leg_position.add(original_legs_offset_from_body_back_bone[leg_name]);
			let current_distance_squared = current_body_leg_position.distanceToSquared(leg_target_position);
			if (force_update || (current_distance_squared > max_square_distance && check_can_move_leg(leg_name))) {

				// Move the leg target where the current body leg position should be
				let new_position;
				let additional_distance_vector = new THREE.Vector3(0, 0, 0);
				if (movement_direction != null) additional_distance_vector = movement_direction.clone().multiplyScalar(additional_distance);
				if (force_update) new_position = current_body_leg_position.clone();
				else new_position = current_body_leg_position.clone().add(additional_distance_vector);
				crab_legs_targets_original_positions[leg_name] = new_position;

				// Start a tween to move the leg target to the new position
				let play_sound = leg_name == "leg_front_targetL" || leg_name == "leg_front_targetR";
				let delay = 0;
				if (force_update && get_leg_alternate(leg_name)) delay = movement_time;
				move_crab_leg_to_target(leg_name, new_position, movement_time, delay, play_sound);

				// if (leg_name == "leg_front_targetL") {
				// 	console.log(crab_legs_state);
				// }
			}
		}
		// // Update the crab_legs_targets dictionary
		// for (let leg_name in new_leg_targets) {
		// 	crab_legs_targets[leg_name] = new_leg_targets[leg_name];
		// }

	}

	// Move the leg target bone to the given position
	function move_crab_leg_to_target(leg_name, target_position, movement_time, delay = 0, play_sound = true) {
		set_leg_grounded(leg_name, false);
		let leg_target = crab_model.getObjectByName(leg_name);
		let leg_target_tween = new TWEEN.Tween(leg_target.position)
			.to(target_position, movement_time)
			.onComplete(function () {
				set_leg_grounded(leg_name, true);
			});
		// leg_target_tween.easing(TWEEN.Easing.Quadratic.In);
		leg_target_tween.delay(delay);
		leg_target_tween.start();

		// Also, move leg up and down by a certain delta thgoughout the movement
		let leg_target_delta = new THREE.Vector3(0, 1.125, 0);
		let leg_target_delta_tween = new TWEEN.Tween(leg_target.position)
			.to(target_position.clone().add(leg_target_delta), movement_time / 2)
			.easing(TWEEN.Easing.Sinusoidal.In);
		leg_target_delta_tween.chain(new TWEEN.Tween(leg_target.position)
			.to(target_position, movement_time / 2)
			.easing(TWEEN.Easing.Sinusoidal.Out));
		leg_target_delta_tween.delay(delay);
		leg_target_delta_tween.start();

		// Play leg movement sound
		if (play_sound) {
			let sound_to_play = leg_movement_sound_1;
			// Switch to sound 2 if sound 1 is playing
			// if (!leg_movement_sound_1.paused) sound_to_play = leg_movement_sound_2;
			if (audioSourceIsPlaying(leg_movement_sound_1)) sound_to_play = leg_movement_sound_2;
			// sound_to_play.play();
			playAudioSource(sound_to_play);
		}
	}

	function face_crab_towards_camera() {
		// Rotate the crab main bone to face the camera, only rotate on y axis, calculating camera angle on xz plane
		let crab_main_bone = get_crab_main_bone();
		let crab_main_bone_position = crab_main_bone.getWorldPosition(new THREE.Vector3());
		let camera_position = camera.getWorldPosition(new THREE.Vector3());
		let direction_vector = camera_position.clone().sub(crab_main_bone_position);
		direction_vector.y = 0;
		direction_vector.normalize();
		let angle = Math.acos(direction_vector.z);
		if (direction_vector.x < 0) angle = -angle;
		crab_main_bone.rotation.z = -1 * angle;
	}

	function playAudioSource(source) {
		if (audioSourceIsPlaying(source)) return;
		source.play();
	}
	function stopAudioSource(source) {
		source.stop();
		setPlaybackTime(source, 0);
	}
	function audioSourceIsPlaying(source) {
		return source.isPlaying;
	}
	function setPlaybackTime(source, playback) {
		source.offset = playback;
	}
	function getDuration(source) {
		return source.buffer.duration;
	}

	function get_keyboard_sound_index(key) {
		let key_index = function_keys.indexOf(key);
		// skips the first 10 buttons (i.e. number buttons)
		if (key_index >= 0) {
			key_index -= 10;
		}
		return key_index;
	}

	function get_keyboard_sound(key, play_sound_too = false) {
		// if the key is from q to p in the keyboard, play the "BVKER - Lunar Kick " + N sound with N being the index of the key in the row + 1
		let key_index = get_keyboard_sound_index(key);

		if (sounds[key_index]) {
			if (play_sound_too) {
				play_keyboard_sound(key);
			}
			return sounds[key_index];
		}

		return null;

	}

	function get_melody_sound(melody_part_number, force_melody_number = -1) {
		let start_index = sounds.length - (5 * 4);	// 5 is the total number of melodies, 4 is the number of parts for each melody
		let melody_number = force_melody_number;
		if (melody_number < 0) {
			melody_number = selected_crab_base_index + 1;
		}
		let index = start_index + ((melody_number - 1) * 4) + (melody_part_number - 1);
		return sounds[index];
	}

	function play_keyboard_sound(key) {

		if (key == "Alt") return;

		let key_index = get_keyboard_sound_index(key);

		if (sounds[key_index].loop) {
			sounds[key_index].play = true;
		} else {
			let sound = sounds[key_index].audio;
			// sound.pause();
			stopAudioSource(sound);
			// sound.currentTime = 0;
			// sound.play();
			setPlaybackTime(sound, 0);
			playAudioSource(sound);
		}

		// let sound = sounds[key_index].audio;
		// let sound_play_each_beat_step = sounds[key_index].play_each_beat_step;
		// sound.pause();
		// let time_multiplier = ((beat_step - 1) % sound_play_each_beat_step) / (sound_play_each_beat_step - 1);
		// sound.currentTime = sound.duration * time_multiplier;
		// sound.play();

		// console.log('play sound for key ' + key + ' (time_multiplier: ' + time_multiplier + ')');
	}

	function stop_keyboard_sound(key) {

		if (key == "Alt") return;

		let key_index = get_keyboard_sound_index(key);

		sounds[key_index].play = false;

		let sound = sounds[key_index].audio;
		// sound.pause();
		stopAudioSource(sound);
		// sound.currentTime = 0;
		setPlaybackTime(sound, 0);

		// console.log('stop sound for key ' + key);
	}

	// Add an event listener for the "Tab" button, which will toggle the camera focus between the crab and the center of the screen
	document.addEventListener('keydown', function (event) {
		if (event.key == "Tab") {
			event.preventDefault();
			focus_camera(!camera_is_focused_on_crab);
			camera_is_focused_on_crab = !camera_is_focused_on_crab;
		}
	});

	// Create a render function
	const render = function () {

		// setTimeout(() => {

		requestAnimationFrame(render);

		deltaTime += clock.getDelta();

		if (deltaTime > 1 / FPS) {

			if (scene_is_ready) {


				// update the tweens
				TWEEN.update();

				// update the orbit controls
				controls.update();

				if (DEBUG) {
					// update the camera stats
					updateCameraPosition();

					// update the stats
					stats.update();
				}

				// Check if a key has been held down for long enough to "lock" it
				for (let key in pressing) {
					let key_obj = pressing[key];
					let min_hold_time = beat_duration * 2;
					if (key_obj.pressed && clock.getElapsedTime() - key_obj.time > min_hold_time && !key_obj.looping) {
						// let sound_obj = get_keyboard_sound(key);
						// let is_lead_key = sound_obj.name.includes('lead');
						// if (sound_obj.loop && !is_lead_key) {
						key_obj.looping = true;
						animate_button_base(key);
						// }
					}
				}

				if (crab_model != undefined) {

					// Update crab legs targets
					// update_legs_targets();

					// update leg IK point
					ikSolver.update();
				}

				if (effect_canvas_rectangle_size != undefined) {
					animate_effect_canvas_single_rectangle();
				}

				// if (sounds_are_playing) {
				// 	let hue_offset_speed = 30;
				// 	background_hue_offset += hue_offset_speed * (1 / FPS);
				// 	if (background_hue_offset > 360) background_hue_offset -= 360;
				// }
				// update_scene_background_color();

				force_face_guitar_model_in_front();
				force_face_bass_model_in_front();

				// render the scene
				// NOTE: This should always be the last call in the render function
				renderer.render(scene, camera);
			}

			if (!scene_is_ready) {
				// Check if models have been loaded
				let keyboard_model_loaded = whole_keyboard_container != undefined && whole_keyboard_container.children.length > 0;
				let crab_model_loaded = crab_model != undefined && crab_model.children.length > 0;
				let bass_model_loaded = true;
				let dj_station_model_loaded = true;
				let guitar_model_loaded = guitar_model != undefined && guitar_model.children.length > 0;
				let synth_model_loaded = true;
				let piano_model_loaded = piano_model != undefined && piano_model.children.length > 0;
				if (!started_loading_instruments && keyboard_model_loaded && crab_model_loaded) {
					load_all_instruments_models();
				}
				if (keyboard_model_loaded &&
					crab_model_loaded &&
					bass_model_loaded &&
					dj_station_model_loaded &&
					guitar_model_loaded &&
					synth_model_loaded &&
					piano_model_loaded) {
					// All models have been loaded, scene is ready
					on_scene_is_ready();
				}
			}

			deltaTime = deltaTime % (1 / FPS);

		}

	}

	// Recursive function (called every beat) used to play audio sources on loop
	function sounds_looper() {

		// Triggers 32 times per beat
		setInterval(() => {

			beat_step += 1;

			if (beat_step >= 512) beat_step = 0;	// 512 is 4 bars of 32 steps

			if (holding_crab_key && !moving_crab) {
				if (beat_step % melodies_play_each_step == 0) {
					play_melody_sound();
				} else if (!melody_sound_is_playing && beat_step % 16 == 0) {
					melody_sound_is_playing = true;
					// Starts playing the melody sound from the point is should play from
					melody_part_to_play = 1;
					let sound_obj = get_melody_sound(melody_part_to_play);
					melody_part_to_play += 1;
					let sound = sound_obj.audio;
					let sound_play_each_beat_step = sound_obj.play_each_beat_step;
					let time_multiplier = ((beat_step - 1) % sound_play_each_beat_step) / (sound_play_each_beat_step - 1);
					let playbackTime = getDuration(sound) * time_multiplier;
					setPlaybackTime(sound, playbackTime);
					playAudioSource(sound);
					// Also sets to play the melody sound for next beats
					// play_melody_sound();
				}
			} else if (((moving_crab || !holding_crab_key) && melody_sound_is_playing) && beat_step % 8 == 0) {
				stop_melody_sound();
			}

			let effect_canvas_mod = Math.floor(64 * effect_canvas_play_each_beat);
			if (effect_canvas_animation_is_playing && beat_step % effect_canvas_mod == 0) restart_effect_canvas_animation();

			let no_sound_playing = true;
			let no_drum_sounds_playing = true;

			let playing_keys_string = "";

			for (let i = 0; i < sounds.length; i++) {

				let sound_obj = sounds[i];
				let sound = sound_obj.audio;

				if (sound_obj.loop) {

					// if (beat_step % sound_obj.play_each_beat_step == 0) sound.pause();
					if (beat_step % sound_obj.play_each_beat_step == 0) stopAudioSource(sound);

					if (sound_obj.play) {

						// if (sound.paused) {
						if (!audioSourceIsPlaying(sound)) {

							let sound_play_each_beat_step = sound_obj.play_each_beat_step;

							let time_multiplier = (beat_step % sound_play_each_beat_step) / (sound_play_each_beat_step - 1);
							// let playbackTime = sound.duration * time_multiplier;
							// sound.currentTime = playbackTime;
							// sound.play();
							let playbackTime = getDuration(sound) * time_multiplier;
							// console.log('playbackTime: ' + playbackTime);
							setPlaybackTime(sound, playbackTime);
							playAudioSource(sound);

							if (sound_obj.play_once) {
								sound_obj.play = false;
							}

						}

						// let sound_obj_offset = sound_obj.offset_beat_steps;
						// let play_each_beat_step = sound_obj.play_each_beat_step;
						// if ((beat_step - sound_obj_offset) % play_each_beat_step == 0) {
						// 	sound_obj.audio.pause();
						// 	sound_obj.audio.currentTime = 0;
						// 	sound_obj.audio.play();
						// }
					}

					// if (!sound.paused) no_sound_playing = false;
					if (audioSourceIsPlaying(sound)) no_sound_playing = false;

					if (audioSourceIsPlaying(sound) && i < sounds.length - 5 * 4) no_drum_sounds_playing = false;

				}

			}


			if (no_sound_playing) {

				if (playing_idle) stop_crab_idle();
				beat_step = -1;

				if (effect_canvas_animation_is_playing) stop_effect_canvas_animation();

			} else {

				if (!playing_idle && !moving_crab) {
					start_crab_idle();
				}

				if (!effect_canvas_animation_is_playing) start_effect_canvas_animation();
			}

			sounds_are_playing = !no_sound_playing;

			// Start / stop the crab's melody animation when the melody sound is playing / not playing
			if (melody_sound_is_playing && !moving_crab) {
				start_crab_melody_animation();
			} else {
				stop_crab_melody_animation();
			}


		}, beat_duration * 1000 / 32);

	}

	function start_crab_melody_animation() {
		let pose_number = selected_crab_base_index + 1;
		switch (pose_number) {
			case crab_poses.bass:
				if (current_crab_pose != crab_poses.bass) pose_crab_for_bass();
				start_crab_bass_animation();
				break;
			case crab_poses.dj_station:
				if (current_crab_pose != crab_poses.dj_station) pose_crab_for_dj_station();
				start_crab_dj_station_animation();
				break;
			case crab_poses.guitar:
				if (current_crab_pose != crab_poses.guitar) pose_crab_for_guitar();
				start_crab_guitar_animation();
				break;
			case crab_poses.synth:
				if (current_crab_pose != crab_poses.synth) pose_crab_for_synth();
				start_crab_synth_animation();
				break;
			case crab_poses.piano:
				if (current_crab_pose != crab_poses.piano) pose_crab_for_piano();
				start_crab_piano_animation();
				break;
			default:
				console.log("WARNING: Undefined melody animation for crab base number " + pose_number + " (" + crab_poses.guitar.toString() + ")!");
				break;
		}
	}
	function stop_crab_melody_animation() {
		if (current_crab_pose != crab_poses.neutral) pose_crab_for_neutral_position();
	}

	sounds_looper();

	function reset_all_keys(reset_alt_key_too = true) {
		for (let key in pressing) {
			if (!reset_alt_key_too && key == "Alt") continue;
			let key_obj = pressing[key];
			if (key_obj.pressed) {
				animate_keyboard_button(key, false);
				pressing[key] = {
					pressed: false,
					time: -1,
					looping: false
				}
				stop_keyboard_sound(key);
			}
		}
	}

	function construct_random_loop_string(kick_snare_key = null, hi_hat_key = null, bass_key = null) {
		let loop_string = "";
		// Choose a random loop: kick-snare, hi-hat, bass
		// This is done by choosing a random loop from the premade_loops object by then outputting a string of the form "XYZ" with X being the kick-snare loop, Y being the hi-hat loop and Z being the bass loop

		// Choose a random loop (level 1)
		let random_loop_level_1 = Math.floor(Math.random() * Object.keys(premade_loops).length);
		let level_1_key = Object.keys(premade_loops)[random_loop_level_1];
		if (kick_snare_key != null) level_1_key = kick_snare_key;
		loop_string += level_1_key;
		// Choose a random loop (level 2)
		let random_loop_level_2 = Math.floor(Math.random() * Object.keys(premade_loops[level_1_key]).length);
		let level_2_key = Object.keys(premade_loops[level_1_key])[random_loop_level_2];
		if (hi_hat_key != null) level_2_key = hi_hat_key;
		loop_string += level_2_key;
		// Choose a random loop (level 3)
		let random_loop_level_3 = Math.floor(Math.random() * premade_loops[level_1_key][level_2_key].length);
		let level_3_key = premade_loops[level_1_key][level_2_key][random_loop_level_3];
		if (bass_key != null) level_3_key = bass_key;
		loop_string += level_3_key;

		return loop_string;
	}

	function play_melody_sound() {
		// set to play one of the "lead" sounds
		melody_sound_is_playing = true;
		let melody_sound = get_melody_sound(melody_part_to_play);
		melody_part_to_play += 1;
		if (melody_part_to_play > 4) melody_part_to_play = 1;
		melody_sound.play = true;

		// console.log('play melody sound ' + melody_sound.name);
	}

	function stop_melody_sound() {

		// console.log('stopping melody sounds for sound number ' + (previously_selected_crab_base_index + 1).toString());

		// for (let i = 1; i <= 4; i++) {
		// 	// Stop all melody parts of previously selected sound
		// 	let melody_sound = get_melody_sound(i, previously_selected_crab_base_index);
		// 	melody_sound.play = false;
		// 	stopAudioSource(melody_sound.audio);
		// }

		// Stop all melody parts of previously selected sound
		for (let j = 1; j <= 5; j++) {
			for (let i = 1; i <= 4; i++) {
				let melody_sound = get_melody_sound(i, j);
				melody_sound.play = false;
				stopAudioSource(melody_sound.audio);
			}
		}

		melody_part_to_play = 1;
		melody_sound_is_playing = false;
	}

	function stop_all_melody_sounds() {
		for (let j = 1; j <= 5; j++) {
			for (let i = 1; i <= 4; i++) {
				// Stop all melody parts of previously selected sound
				let melody_sound = get_melody_sound(i, j);
				melody_sound.play = false;
				stopAudioSource(melody_sound.audio);
			}
		}
		melody_part_to_play = 1;
		melody_sound_is_playing = false;

		holding_crab_key = false;
	}

	async function on_scene_is_ready() {

		if (!scene_is_ready) {

			scene_is_ready = true;

			focus_camera(false, 2000);

			// Add the event listeners to the various click and jeyboard events

			// Add the click event listener to the keyboard_crab_base
			// Uses mousedown and mouseup events to check if the user clicked without dragging
			window.addEventListener('mousedown', function (event) {
				if (moving_crab) return;
				// Stre the current mouse position
				clicked_screen_pos.x = (event.clientX / window.innerWidth) * 2 - 1;
				clicked_screen_pos.y = -(event.clientY / window.innerHeight) * 2 + 1;
			});
			window.addEventListener('mouseup', function (event) {
				if (moving_crab) return;
				// Check if the user clicked on the keyboard_crab_base
				let raycaster = new THREE.Raycaster();
				let mouse = new THREE.Vector2();
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
				// Check if the mouse position is close enough to the previously clicked position
				let mouse_position_delta = mouse.clone().distanceToSquared(clicked_screen_pos);
				let max_drag_distance = 0.0025;
				if (mouse_position_delta > max_drag_distance * max_drag_distance) return;

				// User clicked without dragging
				raycaster.setFromCamera(mouse, camera);
				let intersects = raycaster.intersectObjects(keyboard_crab_bases, false);
				let clicked_base_index = -1;

				if (intersects.length) {

					for (let i = 0; i < keyboard_crab_bases.length; i++) {
						if (intersects[0].object.name == "crab_square_" + (i + 1)) {
							clicked_base_index = i;
							break;
						}
					}

					if (clicked_base_index == -1 || selected_crab_base_index == clicked_base_index) return;

					set_crab_base_as_active(clicked_base_index);

					// selected_crab_base_index = intersected_base_index;

					// console.log(intersected_base_index);
					// Get the clicked base
					let clicked_base = intersects[0].object;
					let clicked_base_world_position = clicked_base.getWorldPosition(new THREE.Vector3());
					// Get the clicked position on the surface of the base (in world coordinates)
					// NOTE: should also take into accont crab's scale (i.e. crab's model position in world coordinates)
					let clicked_position = intersects[0].point;
					clicked_position.y = 0;

					// Calculate the bounding box dimensions of the clicked object
					let bounding_box = new THREE.Box3().setFromObject(clicked_base);
					let bounding_box_width = bounding_box.max.x - bounding_box.min.x;
					let bounding_box_length = bounding_box.max.z - bounding_box.min.z;
					// Transfor the bounding box to world coordinates
					bounding_box.applyMatrix4(clicked_base.matrixWorld);

					let reduce_min_width = 2.75;
					let reduce_min_length = 0.875;

					let reduce_max_width = reduce_min_width;
					// let reduce_max_length = 2.375;
					let reduce_max_length = 2.4;

					if (clicked_base_index == 0) {
						// Bass base: reduce the min position
						reduce_max_length += 0.35;
					}

					// Apply the "scale" to the bounding box to get the actual max and min position of the clicked object to then clamp the clicked position to be inside the object
					let min_bounding_box_position = new THREE.Vector3(
						clicked_base_world_position.x - (bounding_box_width / 2 - reduce_min_width),
						0,
						clicked_base_world_position.z - (bounding_box_length / 2 - reduce_min_length)
					);
					let max_bounding_box_position = new THREE.Vector3(
						clicked_base_world_position.x + (bounding_box_width / 2 - reduce_max_width),
						0,
						clicked_base_world_position.z + (bounding_box_length / 2 - reduce_max_length)
					);

					// Clamp the position on the object to be inside the bounding box with the given max limits around the center of the bounding box
					// NOTE: the position is relative to the center of the bounding box
					clicked_position.clamp(min_bounding_box_position, max_bounding_box_position);

					if (clicked_base_index == 4) {
						// Piano base: set the position to an exact position (to allow to correctly place the piano)
						let offset_from_base_boundary = bounding_box_length / 2 - reduce_min_length;
						if (selected_keyboard_version == keyboard_versions.laptop_keyboard) offset_from_base_boundary += 0.25;
						else if (selected_keyboard_version == keyboard_versions.piano_keyboard) offset_from_base_boundary += 0.275;
						clicked_position = new THREE.Vector3(clicked_base_world_position.x, 0, clicked_base_world_position.z - offset_from_base_boundary);
					}

					// Move the crab to the clicked position
					// Multiply the relative position by the crab's scale inverse
					move_crab(clicked_position);

					if (selected_crab_base_index != clicked_base_index) previously_selected_crab_base_index = selected_crab_base_index;
					selected_crab_base_index = clicked_base_index;
				}
			});
			// Make it so that, at each keyboard button press (for a letter), the "animate_keyboard_button" function is called and plays the down animation when the button is pressed, and up animation when it is released
			window.addEventListener('keydown', function (event) {
				// Dont repeat the event if the key is already pressed
				if (!event.repeat) {

					if (all_keys.includes(event.key)) event.preventDefault();

					let pressed_key = event.key;
					if (actual_function_keys.includes(pressed_key) || actual_function_keys.includes(pressed_key.toLowerCase())) pressed_key = pressed_key.toLowerCase();

					animate_keyboard_button(pressed_key, true);

					if (pressed_key === ' ') {
						// Pressed space

						// Resets all buttons key which are down (make them get back up) and stops their sounds
						console.log("Pressed space");
						reset_all_keys();

						// Iterates thgough all the sounds and stops them
						sounds.forEach(sound_obj => {
							let sound = sound_obj.audio;
							stopAudioSource(sound);
						});

						stop_all_melody_sounds();

					} else if (pressed_key === ',') {

						// pressed the "melody" key (comma ",")

						// Reset all keys and start playing a new premade loop
						reset_all_keys(false);
						// Start playing a new premade loop
						let biased_kick_snare_key = null;
						if (!pressed_beats_key_once) biased_kick_snare_key = "W";	//  If this is the first ever generated sound, start from the "amen break" kick snare
						let random_loop_string = construct_random_loop_string(biased_kick_snare_key);
						// console.log("random_loop_string: " + random_loop_string);
						// Press (and set to holding) all keys in the random loop string
						for (let i = 0; i < random_loop_string.length; i++) {
							let key = random_loop_string[i].toString().toLowerCase();
							// console.log("Pressing key " + key);
							pressing[key] = {
								pressed: true,
								time: 0,
								looping: true
							}
							play_keyboard_sound(key);
							animate_keyboard_button(key, true);
							animate_button_base(key);
						}

						if (!pressed_beats_key_once) pressed_beats_key_once = true;

						// Generates a new lead sound
						// refresh_lead();
						// } else if (pressed_key == 'Alt') {

						// 	holding_crab_key = true;

						// 	// play_random_lead_sound();

					} else {

						if (actual_function_keys.includes(pressed_key) || pressed_key == "Alt") {

							if (pressed_key == "Alt") {
								holding_crab_key = true;
								// play_melody_sound();
							}

							if (actual_function_keys.includes(pressed_key)) {
								if (!pressing[pressed_key.toString()] || !pressing[pressed_key.toString()].pressed) {
									// get_keyboard_sound(pressed_key);
									play_keyboard_sound(pressed_key, true);
								}
							}

							pressing[pressed_key.toString()] = {
								pressed: true,
								time: clock.getElapsedTime(),
								looping: false
							}
						}
					}

				}
			});
			window.addEventListener('keyup', function (event) {
				// console.log(pressed_key);
				if (!event.repeat) {

					let pressed_key = event.key;
					if (actual_function_keys.includes(pressed_key) || actual_function_keys.includes(pressed_key.toLowerCase())) pressed_key = pressed_key.toLowerCase();

					if (pressing[pressed_key.toString()] && pressing[pressed_key.toString()].looping) return;

					animate_keyboard_button(pressed_key, false);

					if (pressed_key == 'Alt') {

						holding_crab_key = false;

					} else {

						if (actual_function_keys.includes(pressed_key)) {

							pressing[pressed_key.toString()] = {
								pressed: false,
								time: -1,
								looping: false
							}

							let sound_obj = get_keyboard_sound(pressed_key);
							if (sound_obj.loop) stop_keyboard_sound(pressed_key);
						}
					}
				}
			});

			// Remove the #main-menu element after 100ms and with a fade out animation of 1000ms
			let loading_screen = document.getElementById('main-menu');
			let fade_out_delay = 250;
			let fadeout_time = 1000;
			setTimeout(() => {
				loading_screen.style.animation = "fadeout " + fadeout_time.toString() + "ms forwards";
			}, fade_out_delay);
			setTimeout(() => {
				// remove the element from display after the total animation time
				loading_screen.style.display = "none";
			}, fade_out_delay + fadeout_time);
			setTimeout(() => {
				// Show controls
				toggle_controls();
			}, fade_out_delay + fadeout_time + 500);

			// Add event listeners for controls on press of enter button
			window.addEventListener('keydown', function (event) {
				if (event.key == "Enter") {
					// Toggle the controls
					toggle_controls();
				}
			});

			console.log("Scene is ready!");

		}

	}

	render();

}

let scene_already_started = false;

function start_scene_with_keyboard_version(keyboard_version) {
	if (scene_already_started) return;
	scene_already_started = true;
	selected_keyboard_version = keyboard_version;
	setTimeout(() => {
		// Start the scene
		start_scene();
	}, 150);
}

function fade_out_ui_elements(keyboard_version) {
	// Add animation "scaledown" in style of all #buttons-container > div and #logo-container
	let buttons_container = document.getElementById("buttons-container");
	let logo_container = document.getElementById("logo-container");
	let buttons_container_children = buttons_container.children;
	let animation_delay = 750;
	let move_away_animation_time = 1250;
	let in_between_delay = 200;
	logo_container.style.animation = "move-away-up " + (move_away_animation_time + in_between_delay * buttons_container_children.length).toString() + "ms " + animation_delay + "ms forwards";
	// Move down with a delay in between for the div children of #buttons-container
	for (let i = 0; i < buttons_container_children.length; i++) {
		let index = buttons_container_children.length - i - 1;
		if (keyboard_version != keyboard_versions.laptop_keyboard) index = i;
		let child = buttons_container_children[index];
		let delay_sting = (animation_delay + in_between_delay * (i + 1)).toString() + "ms";
		child.style.animation = "move-away-down " + move_away_animation_time.toString() + "ms " + delay_sting + " forwards";
		// child.style.animationDelay = in_between_delay.toString() + "s";
	}
}

// Make it so that if the user clicks on the "#pc-version" button, "#laptop-version" button or "#typewriter-version" button, the scene is started with the corresponding keyboard version
document.getElementById("pc-version").addEventListener('click', () => {
	if (scene_already_started) return;
	// Append class "selected" to the button
	document.getElementById("pc-version").classList.add("selected");
	fade_out_ui_elements(keyboard_versions.pc_keyboard);
	start_scene_with_keyboard_version(keyboard_versions.pc_keyboard);
});
document.getElementById("laptop-version").addEventListener('click', () => {
	if (scene_already_started) return;
	// Append class "selected" to the button
	document.getElementById("laptop-version").classList.add("selected");
	fade_out_ui_elements(keyboard_versions.laptop_keyboard);
	start_scene_with_keyboard_version(keyboard_versions.laptop_keyboard);
});
document.getElementById("typewriter-version").addEventListener('click', () => {
	if (scene_already_started) return;
	// Append class "selected" to the button
	document.getElementById("typewriter-version").classList.add("selected");
	fade_out_ui_elements(keyboard_versions.typewriter_keyboard);
	start_scene_with_keyboard_version(keyboard_versions.typewriter_keyboard);
});

let initialized_controls = false;
let controls_visible = false;
function toggle_controls() {
	// Make the element with id "controls" visible (add animation "controls-hide" or "controls-show" to the element)
	let controls = document.getElementById("scene-ui");
	if (!initialized_controls) {
		controls.style.visibility = "visible";
		controls.style.transform = "translateY(100px)";
		initialized_controls = true;
	}
	let animation_time = 250;
	if (controls_visible) {
		controls.style.animation = "controls-hide " + animation_time.toString() + "ms forwards";
	} else {
		controls.style.animation = "controls-show " + animation_time.toString() + "ms forwards";
	}
	controls_visible = !controls_visible;

}







