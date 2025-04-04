export class InputManager {
    constructor(player, jumpSound) {
        this.keys = {
            a: { pressed: false },
            d: { pressed: false },
            s: { pressed: false },
            w: { pressed: false }
        };
        
        this.player = player;
        this.jumpSound = jumpSound;
        
        // Bind the methods to maintain 'this' context
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        
        // Add event listeners
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyA':
                this.keys.a.pressed = true;
                if (!this.player.isJumping) this.player.setAnimation('run', this.keys);
                break;
            case 'KeyD':
                this.keys.d.pressed = true;
                if (!this.player.isJumping) this.player.setAnimation('run', this.keys);
                break;
            case 'KeyS':
                this.keys.s.pressed = true;
                if (!this.player.isJumping) this.player.setAnimation('run', this.keys);
                break;
            case 'KeyW':
                this.keys.w.pressed = true;
                if (!this.player.isJumping) this.player.setAnimation('run', this.keys);
                break;
            case 'Space':
                if (this.player.isOnGround && !this.player.isJumping) {
                    this.player.velocity.y += 0.08;
                    this.player.position.y += this.player.velocity.y;
                    this.player.isJumping = true;
                    this.player.isOnGround = false;
                    this.player.setAnimation('jump', this.keys);

                    this.jumpSound.currentTime = 0;
                    this.jumpSound.play().catch(e => console.error("Error playing jump sound:", e));
                }
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyA':
                this.keys.a.pressed = false;
                break;
            case 'KeyD':
                this.keys.d.pressed = false;
                break;
            case 'KeyS':
                this.keys.s.pressed = false;
                break;
            case 'KeyW':
                this.keys.w.pressed = false;
                break;
        }
        
        if (!this.keys.a.pressed && !this.keys.d.pressed && !this.keys.s.pressed && !this.keys.w.pressed && !this.player.isJumping) {
            this.player.setAnimation('idle', this.keys);
        }
    }
    
    update() {
        // Update player velocity based on keys
        this.player.velocity.x = 0;
        this.player.velocity.z = 0;
        
        if (this.keys.a.pressed) {
            this.player.velocity.x = -0.05;
            if (!this.player.isJumping) {
                this.player.setAnimation('run', this.keys);
                this.player.rotation.y = Math.PI / 2;
            }
        } else if (this.keys.d.pressed) {
            this.player.velocity.x = 0.05;
            if (!this.player.isJumping) {
                this.player.setAnimation('run', this.keys);
                this.player.rotation.y = -Math.PI / 2;
            }
        }

        if (this.keys.s.pressed) {
            this.player.velocity.z = 0.05;
            if (!this.player.isJumping) {
                this.player.setAnimation('run', this.keys);
                this.player.rotation.y = Math.PI;
            }
        } else if (this.keys.w.pressed) {
            this.player.velocity.z = -0.05;
            if (!this.player.isJumping) {
                this.player.setAnimation('run', this.keys);
                this.player.rotation.y = 0;
            }
        }
        
        if (!this.keys.a.pressed && !this.keys.d.pressed && !this.keys.s.pressed && !this.keys.w.pressed && !this.player.isJumping) {
            this.player.setAnimation('idle', this.keys);
        }
    }
    
    getKeys() {
        return this.keys;
    }
}