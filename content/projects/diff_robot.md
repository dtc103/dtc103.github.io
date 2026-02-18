## Project Snapshot

A custom-built differential-wheeled robot platform designed and assembled from scratch to serve as a testbed for comparing different heading control strategies. The robot is built around an **ESP32** microcontroller, communicates via **Micro-ROS over WiFi**, and can be remotely operated through a **ROS2** keyboard interface.

## Objectives

- Design and 3D-print a compact differential-drive robot using readily available components (salvaged gamepad motors, IMU, motor driver).
- Solve the fundamental motor alignment problem: two unmatched DC motors without encoders need closed-loop heading control to drive straight.
- Implement and compare multiple control strategies for yaw tracking on real hardware.

## Hardware

- **ESP32** as the main controller
- **MPU6050 IMU** (GY-521) for yaw and yaw-rate sensing via DMP
- **TB6612FNG** dual motor driver
- **2x DC motors** salvaged from gamepad rumble motors (no position encoders)
- **3D-printed chassis** (custom-designed, STL/OBJ files in the repository)
- LiPo battery with DC-DC converter for power supply

## Control Architecture

All controllers share a common abstract interface (`Controller`) and can be **switched at runtime** via the remote control (keys 1/2/3). Each receives the current yaw, yaw rate, target yaw, velocity, and timestep.

1. **PID Controller**
   Classic proportional-integral-derivative control on yaw error with angle wrapping and integral wind-up clamping. The integral term proved essential to compensate for the weak motors.

2. **Stanley Controller**
   A heading-only variant of the Stanley path-tracking controller. Cross-track correction is prepared but inactive until position encoders are added. Includes yaw-rate damping to reduce oscillations.

3. **Model Predictive Controller (MPC)**
   Predicts yaw evolution over a finite horizon using a first-order yaw-rate model. Minimizes heading error and control effort via a **custom QP solver** (projected gradient descent with Barzilai-Borwein step size), implemented to fit within the ESP32 stack constraints.

## Results

- The **PID controller** is the proven default and reliably tracks the commanded heading.
- Contrary to initial expectations, pure PD control was insufficient; the **I-term** was necessary to overcome steady-state errors from the weak motors.
- The Stanley and MPC controllers are fully implemented and switchable but require further tuning on the physical robot.
- The robot is fully assembled and remotely operable, though the motors are challenged by the overall weight, requiring a push at startup. Future iterations target weight reduction (lower infill, shorter tips, optimized wiring).

## Future Ideas

- Add obstacle sensors (LiDAR or rotating ultrasonic) for MPC-based obstacle avoidance.
- Integrate a magnetometer and Kalman filter for more robust heading estimation.
- Add IR LEDs for external camera-based tracking.
