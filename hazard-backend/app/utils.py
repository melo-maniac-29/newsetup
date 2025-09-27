import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import mobilenet_v2
from PIL import Image

# Choose device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Class mapping (adjust if you add debris etc.)
class_map = {
    0: "electrical hazard detected",
    1: "no hazard",
    2: "waterlogging hazard detected"
}

# Define preprocessing (must match training)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def load_model(model_path: str):
    """
    Load the trained MobileNetV2 model with custom classifier.
    """
    model = mobilenet_v2(pretrained=False)
    model.classifier[1] = nn.Linear(model.last_channel, len(class_map))  # output classes
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model

def predict_image(model, image_path: str):
    """
    Run inference on a single image and return ID, label, and confidence.
    """
    img = Image.open(image_path).convert("RGB")
    img_tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)
        conf, pred = torch.max(probs, 1)

    cls_id = pred.item()
    cls_name = class_map[cls_id]
    return {
        "id": cls_id,
        "label": cls_name,
        "confidence": float(conf.item())
    }
