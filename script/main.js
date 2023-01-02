const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({
  log: false
});

const image_conversion = async (load_file) => {
  
};

const item_texture_load = async (input) => {
  const reader = new FileReader();
  reader.onload = function (inport) {
    const img = new Image();
    img.onload = async () => {
      const size = Math.min(img.naturalWidth,img.naturalHeight);
      temporary_data["image_size"] = size;
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      };
      ffmpeg.FS('writeFile', 'load.bin', await fetchFile(input.files[0]));
      await ffmpeg.run('-i', 'load.bin', '-s', `${size}x${size}`, 'output.png');
      const data = ffmpeg.FS('readFile','output.png');
      ffmpeg.FS('unlink', 'output.png');
      temporary_data.image = new Blob([data.buffer]);
      document.getElementById("item_texture_image").src = window.URL.createObjectURL(new Blob([data.buffer]))
    };
    img.src = inport.target.result;
  };
  reader.readAsDataURL(input.files[0]);
};

const create_content_ui_toggle = (content)=> {
  document.getElementById(content).classList.toggle("create_content_ui_in");
};

const create_project = () => {
  let project_name = prompt("英数字のみ");
  if(project_name !== null && !project_name.match(/\?|!| /)) {
    mcfile["project_name"] = project_name;
    const db = new Dexie("tapiopon-mcaddon-tool");
    db.version(1).stores({
      save: 'id,contents'
    });
    db.save.put({
      id: project_name,
      contents: mcfile
    });
    const project_list = localStorage.getItem("tapiopon-mcaddon-tool-list");
    if(project_list){
      const project_list_array = JSON.parse(project_list);
      project_list_array.push(project_name);
      localStorage.setItem("tapiopon-mcaddon-tool-list", JSON.stringify(project_list_array));
    }else{
      const project_list_array = [project_name];
      localStorage.setItem("tapiopon-mcaddon-tool-list", JSON.stringify(project_list_array));
    }
    location.href = "";
  }
}

const delete_project = (project_name) => {
  if(!confirm("本当に削除しますか？")) return;
  const db = new Dexie("tapiopon-mcaddon-tool");
  db.version(1).stores({
    save: 'id,contents'
  });
  db.save.delete(project_name)
  const project_list = localStorage.getItem("tapiopon-mcaddon-tool-list");
  const project_list_array = JSON.parse(project_list).filter((array_item)=> {
    return array_item !== project_name
  });
  localStorage.setItem("tapiopon-mcaddon-tool-list", JSON.stringify(project_list_array));
  location.href = "";
}

const update_project = () => {
  const db = new Dexie("tapiopon-mcaddon-tool");
  db.version(1).stores({
    save: 'id,contents'
  });
  db.save.put({
    id: mcfile["project_name"],
    contents: mcfile
  });
};

const input_item = () => {
  if(!mcfile["behavior"]["items"]) mcfile["behavior"]["items"] = {};
  mcfile["behavior"]["items"][item_id.value] = {
    "format_version": "1.16.100",
    "minecraft:item": {
      "description": {
        "identifier": `${mcfile["project_name"]}:${item_id.value}`,
        "category": "Items"
      },
      "components": {
        "minecraft:icon": {
          "texture": item_id.value
        },
        "minecraft:render_offsets": {
          "main_hand": {
            "first_person": {
              "scale": [
                (0.1 / (temporary_data["image_size"] / 16)) / 1.8,
                (0.1 / (temporary_data["image_size"] / 16)) / 1.8,
                (0.1 / (temporary_data["image_size"] / 16)) / 1.8
              ]
            },
            "third_person": {
              "scale": [
                (0.1 / (temporary_data["image_size"] / 16)),
                (0.1 / (temporary_data["image_size"] / 16)),
                (0.1 / (temporary_data["image_size"] / 16))
              ]
            }
          }
        }
      }
    }
  };
  
  const components = mcfile["behavior"]["items"][item_id.value]["minecraft:item"]["components"];
  if(item_foil.checked) components["minecraft:foil"] = true;
  if(item_idhand_equipped.checked) components["minecraft:hand_equipped"] = true;
  if(!item_can_destroy_in_creative.checked) components["minecraft:can_destroy_in_creative"] = false;
  if(!item_explodable.checked) components["minecraft:explodable"] = false;
  if(!item_should_despawn.checked) components["minecraft:should_despawn"] = false;
  if(item_liquid_clipped.checked) components["minecraft:liquid_clipped"] = true;
  
  if(item_use_animation_check.checked) components["minecraft:use_animation"] = item_use_animation.value;
    
  if(!mcfile["resource"]["textures"]["tapio_tool"]["items"]) mcfile["resource"]["textures"]["tapio_tool"]["items"] = {};
  mcfile["resource"]["textures"]["tapio_tool"]["items"][item_id.value] = temporary_data.image;
  mcfile["resource"]["textures"]["item_texture.json"]["texture_data"][item_id.value] = {
    "textures": "textures/tapio_tool/items/"+item_id.value
  };
  update_project();
  mcfile["files"]["item"].push(item_id.value);
  item_reset();
  create_content_ui_toggle("create_content_item_ui");
  document.getElementById("added_items").innerHTML +=
  `\<p\>${item_id.value}\</p\>`;
  console.log(mcfile["behavior"]["items"]);
};

const item_reset = () => {
  item_id.value = "";
  item_foil.checked = false;
  item_idhand_equipped.checked = false;
  item_can_destroy_in_creative.checked = true;
  item_explodable.checked = true;
  item_should_despawn.checked = true;
  item_liquid_clipped.checked = false;
  item_use_animation_check.checked = false;
  item_use_animation.value = "eat";
}

const item_load = (load_item_id) => {
  create_content_ui_toggle("create_content_item_ui");
  const load_file = mcfile["behavior"]["items"][load_item_id]["minecraft:item"];
  if(!load_file) return;
  item_id.value = load_file["description"]["identifier"].split(":")[1];
  
  if(load_file["components"]["minecraft:foil"] == true) item_foil.checked = true;else item_foil.checked = false;
  if(load_file["components"]["minecraft:hand_equipped"] == true) item_idhand_equipped.checked = true;else item_idhand_equipped.checked = false;
  if(load_file["components"]["minecraft:can_destroy_in_creative"] == true) item_can_destroy_in_creative.checked = true;else item_can_destroy_in_creative.checked = false;
  if(load_file["components"]["minecraft:explodable"] == true) item_explodable.checked = true;else item_explodable.checked = false;
  if(load_file["components"]["minecraft:should_despawn"] == true) item_should_despawn.checked = true;else item_should_despawn.checked = true;
  if(load_file["components"]["minecraft:liquid_clipped"] == true) item_liquid_clipped.checked = true;else item_liquid_clipped.checked = true;
  
  if(load_file["components"]["minecraft:use_animation"]) {
    item_use_animation_check.checked = true;
    item_use_animation.disabled = false;
    item_use_animation.value = load_file["components"]["minecraft:use_animation"];
  }else{
    item_use_animation_check.checked = false;
    item_use_animation.disabled = true;
  }
};

const item_delete = (load_item_id) => {
  if(!confirm("本当に削除しますか？")) return;
  mcfile["files"]["item"] = mcfile["files"]["item"].filter((array_item)=> {
    return array_item !== load_item_id
  });
  delete mcfile["behavior"]["items"][load_item_id];
  delete mcfile["resource"]["textures"]["item_texture.json"]["texture_data"][load_item_id];
  delete mcfile["resource"]["textures"]["tapio_tool"]["items"][load_item_id];
  update_project();
}

const resource_pack_name_save = () => {
  mcfile["behavior"]["manifest.json"]["header"]["name"] =
  mcfile["resource"]["manifest.json"]["header"]["name"] = resource_pack_name.value;
  
  mcfile["behavior"]["manifest.json"]["header"]["description"] =
  mcfile["resource"]["manifest.json"]["header"]["description"] = resource_pack_description.value;
  
  mcfile["behavior"]["manifest.json"]["header"]["version"] =
  mcfile["resource"]["manifest.json"]["header"]["version"] = [pack_version_1.value, pack_version_2.value, pack_version_3.value]
  update_project();
}

const mc_export = () => {
  const zip = new JSZip();
  zip.folder("behavior").file("manifest.json", JSON.stringify(mcfile["behavior"]["manifest.json"]));
  zip.folder("resource").file("manifest.json", JSON.stringify(mcfile["resource"]["manifest.json"]));
  if(mcfile["behavior"]["items"]) {
    for(let i=0;i<mcfile["files"]["item"].length;i++){
      zip.folder("behavior/items").file(mcfile["files"]["item"][i]+".json",JSON.stringify(mcfile["behavior"]["items"][mcfile["files"]["item"][i]]));
      zip.folder("resource/textures/tapio_tool/items").file(mcfile["files"]["item"][i]+".png", mcfile["resource"]["textures"]["tapio_tool"]["items"][mcfile["files"]["item"][i]]);
    };
    zip.folder("resource/textures").file("item_texture.json", JSON.stringify(mcfile["resource"]["textures"]["item_texture.json"]));
  };
  zip.generateAsync({
    type:"blob",
    mimeType: "application/octet-stream",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  }).then((blob) => {
    const a = document.createElement("a");
    a.download = `${mcfile["resource"]["manifest.json"]["header"]["name"]}.mcaddon`;
    a.href = window.URL.createObjectURL(blob);
    a.click();
  });
};

window.onload = () => {
  const query = document.location.search.substring(1);
  if(query){
    const db = new Dexie("tapiopon-mcaddon-tool");
    db.version(1).stores({
      save: 'id,contents'
    });
    db.save.get(query).then((event)=>{
      mcfile = event.contents;
      resource_pack_name.value = mcfile["resource"]["manifest.json"]["header"]["name"];
      resource_pack_description.value = mcfile["resource"]["manifest.json"]["header"]["description"];
      pack_version_1.value = mcfile["resource"]["manifest.json"]["header"]["version"][0];
      pack_version_2.value = mcfile["resource"]["manifest.json"]["header"]["version"][1];
      pack_version_3.value = mcfile["resource"]["manifest.json"]["header"]["version"][2];
      for(let i=0;i<mcfile["files"]["item"].length;i++){
        document.getElementById("added_items").innerHTML +=
        `\<div\>`+
        `\<p onclick="item_load('${mcfile["files"]["item"][i]}')"\>${mcfile["files"]["item"][i]}\</p\>`+
        `\<button onclick="item_delete('${mcfile["files"]["item"][i]}')"\>削除\</button\>`+
        `\</div\>`
      }
    });
    document.getElementById("view_project_edit").style.display = "block";
    document.getElementById("view_project").style.display = "none";
  }else{
    const project_list = localStorage.getItem("tapiopon-mcaddon-tool-list");
    if(project_list) {
      const project_list_array = JSON.parse(project_list);
      for(let i=0;i<project_list_array.length;i++){
        document.getElementById("projects").innerHTML +=
        `\<div\>`+
        `\<a href="${location.href}?${project_list_array[i]}"\>${project_list_array[i]}\</a\>`+
        `\<button onclick="delete_project('${project_list_array[i]}')"\>プロジェクトを削除\</button\>`+
        `\</div\>`
      }
    }
  }
  document.getElementById("item_texture_image").src="data:image/png;base64,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";
};

let temporary_data  = {
  image_size: 0,
  image: ""
};

let mcfile = {
  "project_name": "",
  "files": {
    "item": [],
    "block": []
  },
  "resource": {
    "textures": {
      "item_texture.json": {
        "resource_pack_name" : "tapiopon",
        "texture_name": "atlas.items",
        "texture_data" : {
        }
      },
      "tapio_tool": {
      }
    },
    "sounds": {
      "tapiopon_sound": {
        
      },
      "sound_definitionsfile.json": {
        "format_version": "1.14.0",
        "sound_definitions": {
          
        }
      }
    },
    "manifest.json": {
      "format_version": 2,
      "header": {
        "name": "Tapiopon Addon",
        "description": "たぴおぽんのあどおんツール",
        "version": [0, 0, 1],
        "uuid": crypto.randomUUID(),
        "min_engine_version": [1, 19, 0]
      },
      "modules": [
        {
          "type": "resources",
          "description": "resources",
          "version": [0, 0, 1],
          "uuid": crypto.randomUUID()
        }
      ]
    }
  },
  "behavior": {
    "manifest.json": {
      "format_version": 2,
      "header": {
        "name": "Tapiopon Addon",
        "description": "たぴおぽんのあどおんツール",
        "version": [0, 0, 1],
        "uuid": crypto.randomUUID(),
        "min_engine_version": [1, 19, 0]
      },
      "modules": [
        {
          "type": "data",
          "description": "data",
          "version": [0, 0, 1],
          "uuid": crypto.randomUUID()
        }
      ]
    }
  }
}