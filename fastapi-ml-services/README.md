# FastAPI ML Services for AI-Powered Flood & Disaster Management Platform

This FastAPI service provides machine learning capabilities for the disaster management platform, working alongside Convex for real-time data sync.

## Services Provided

### 🤖 ML Model Services
- **Hazard Classification**: CNN/CLIP models for image-based hazard verification
- **Flood Prediction**: LSTM/RNN models using weather & sensor data
- **Rescue Prioritization**: Multi-factor scoring for SOS requests
- **Safe Zone Recommendations**: Graph algorithms for optimal routing

### 🌐 Communication Services  
- **Mesh Network Emulation**: BLE/Wi-Fi mesh simulation
- **LoRa Gateway Emulation**: Long-range communication bridge
- **Message Propagation**: Offline message routing and delivery

### 📊 Analytics Services
- **Real-time Analytics**: SOS clustering, hotspot detection
- **Predictive Analytics**: Flood forecasting, rescue ETA estimation
- **Performance Metrics**: System health, model accuracy tracking

## Architecture

```
FastAPI ML Services (Port 8000)
├── /ml/
│   ├── /hazard-classify     # Image classification
│   ├── /flood-predict       # Weather-based prediction
│   ├── /rescue-priority     # SOS prioritization
│   └── /safe-zones          # Route optimization
├── /mesh/
│   ├── /nodes               # Mesh node management
│   ├── /messages            # Message propagation
│   └── /lora-gateway        # LoRa emulation
├── /analytics/
│   ├── /predictions         # AI predictions
│   ├── /clustering          # SOS hotspots
│   └── /metrics             # Performance data
└── /health                  # Health checks
```

## Setup & Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# External APIs
OPENWEATHER_API_KEY=your_openweather_key
NOAA_API_KEY=your_noaa_key

# ML Model Paths
HAZARD_MODEL_PATH=models/hazard_classifier.pkl
FLOOD_MODEL_PATH=models/flood_predictor.h5

# Mesh Network Config
MESH_NETWORK_RANGE=100  # meters
LORA_GATEWAY_RANGE=10000  # meters

# Redis for caching (optional)
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### ML Services
- `POST /ml/hazard-classify` - Classify hazard from image
- `POST /ml/flood-predict` - Predict flood risk
- `POST /ml/rescue-priority` - Calculate rescue priority
- `GET /ml/safe-zones` - Get optimal safe zones

### Mesh Network
- `POST /mesh/nodes/register` - Register mesh node
- `POST /mesh/messages/propagate` - Propagate message
- `GET /mesh/topology` - Get network topology

### Analytics  
- `GET /analytics/predictions/{type}` - Get AI predictions
- `GET /analytics/hotspots` - Get SOS clustering data
- `GET /analytics/metrics` - System performance metrics

## Data Flow with Convex

```
[React Native App] 
    ↓ (Real-time sync)
[Convex Backend] 
    ↓ (ML requests)  
[FastAPI ML Services]
    ↓ (Results)
[Convex Backend]
    ↓ (Real-time updates)
[React Native App]
```

## Model Training Data Requirements

### Hazard Classification
- **Input**: Images (flood damage, debris, blocked roads)
- **Labels**: hazard_type, severity, location_type
- **Features**: image_features, metadata (timestamp, gps, weather)

### Flood Prediction  
- **Input**: Weather data, river levels, historical floods
- **Features**: rainfall, temperature, river_gauge, soil_moisture, elevation
- **Output**: flood_probability, estimated_depth, time_to_peak

### Rescue Prioritization
- **Input**: SOS location, family_cluster_size, battery_level, time_elapsed
- **Features**: distance_to_safe_zone, local_hazard_density, weather_conditions
- **Output**: priority_score (0-100), estimated_rescue_time

## Deployment

### Development
```bash
uvicorn app.main:app --reload
```

### Production (Docker)
```bash
docker build -t disaster-ml-services .
docker run -p 8000:8000 disaster-ml-services
```

### Cloud Deployment
- **Railway**: `railway deploy`
- **Fly.io**: `fly deploy`  
- **Render**: Connect GitHub repo

## Testing

```bash
# Run tests
pytest

# Test ML models
pytest tests/ml/

# Test mesh network
pytest tests/mesh/

# Integration tests
pytest tests/integration/
```