
export class Scene {

    constructor (path) {

        this.canvas = document.getElementById("vjs-0")

        this.width = window.getComputedStyle(this.canvas).width.split("px")[0]
        this.height = window.getComputedStyle(this.canvas).height.split("px")[0]

        this.canvas.height = this.height
        this.canvas.width = this.width

        this.ctx = this.canvas.getContext('2d')

        this.particles = []

        this.previous_mouse_pos = {
            x: 0,
            y: 0
        }

        this.settings = null
        this.fetchSettings(path)

        for (var i = 0; i < this.settings.particleNumber; i++) {
            this.particles.push(new Particle(this.settings, this.width, this.height, false))
        }

        Scene.scenes += 1
        this.previous_scroll_pos = 0

        this.effects()
        this.animate()

    }

    fetchSettings (path) {

        var xhttp = new XMLHttpRequest()
        xhttp.open("GET", path, false)
        xhttp.onreadystatechange = () => {
            this.settings = JSON.parse(xhttp.responseText)
        }
        xhttp.send()

    }
          

    getMousePos (canvas, evt) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        };
    }

    draw () {

        this.ctx.clearRect(0, 0, this.width, this.height)

        for (var i = 0; i < this.particles.length; i++) {
            
            this.ctx.fillStyle = this.particles[i].color

            this.ctx.beginPath()

            this.ctx.arc(this.particles[i].x, this.particles[i].y, this.particles[i].radius, 0, 2 * Math.PI)

            this.ctx.fill()

            if (this.particles[i].x > this.width || this.particles[i].x < 0 ||
                this.particles[i].y > this.height || this.particles[i].y < 0) {
                this.particles.splice(i, 1)
                this.particles.push(new Particle(this.settings, this.width, this.height))
            }

            if (this.settings.linkParticles.link) {

                for (var j = i + 1; j < this.particles.length; j++) {

                    var distance = Math.sqrt(Math.pow((this.particles[j].x - this.particles[i].x), 2) + Math.pow((this.particles[j].y - this.particles[i].y), 2) + Math.pow(this.particles[j].z - this.particles[i].z, 2))

                    if (distance <= this.settings.linkParticles.linkRadius) {
 
                        var opacity = 1 - (distance / this.settings.linkParticles.linkRadius)
                        var alpha = ("0" + Math.round(opacity * 255).toString(16)).substr(-2)

                        this.ctx.beginPath()
                        this.ctx.strokeStyle = this.settings.linkParticles.color + alpha
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y)
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y)
                        this.ctx.stroke()
                        this.ctx.closePath()

                    }

                }
    
            }

            if (this.settings.effects.connectMouse) {

                var distance = Math.sqrt(Math.pow((this.previous_mouse_pos.x - this.particles[i].x), 2) + Math.pow((this.previous_mouse_pos.y - this.particles[i].y), 2) + Math.pow(this.particles[i].z, 2))

                if (distance <= this.settings.linkParticles.linkRadius) {

                    var opacity = 1 - (distance / this.settings.linkParticles.linkRadius)
                    var alpha = ("0" + Math.round(opacity * 255).toString(16)).substr(-2)

                    this.ctx.beginPath()
                    this.ctx.strokeStyle = this.settings.linkParticles.color + alpha
                    this.ctx.moveTo(this.previous_mouse_pos.x, this.previous_mouse_pos.y)
                    this.ctx.lineTo(this.particles[i].x, this.particles[i].y)
                    this.ctx.stroke()
                    this.ctx.closePath()

                }

            }
    
        }

        for (var i = 0; i < this.particles.length; i++) {
            this.particles[i].update()
        }
        
    }

    animate () {
        this.draw()
        window.requestAnimationFrame(this.animate.bind(this))
    }

    effects () {

        window.addEventListener("mousemove", (e) => {

            var mousepos = this.getMousePos(this.canvas, e)

            if (this.settings.effects.parallax) {

                if (this.previous_mouse_pos != null) {

                    for (var i = 0; i < this.particles.length; i++) {
    
                        this.particles[i].x += (mousepos.x - this.previous_mouse_pos.x) / this.particles[i].z
                        this.particles[i].y += (mousepos.y - this.previous_mouse_pos.y) / this.particles[i].z
    
                    }
                }

            }

            this.previous_mouse_pos = mousepos

        })

        window.addEventListener("scroll", () => {
            
            if (this.settings.effects.scroll) {

                var scrollpos = window.scrollY
                console.log(scrollpos)

                for (var i = 0; i < this.particles.length; i++) {
                    this.particles[i].y -= (scrollpos - this.previous_scroll_pos) / this.particles[i].z
                }

                this.previous_scroll_pos = scrollpos
            }

        })

    }

}

class Particle {

    constructor (settings, width, height, initial=true) {
        
        this.toss = Math.round(this.random(1, 2))
        this.color = settings.particles.color
        this.random_velocity = settings.particles.velocity.random

        this.z = this.random(settings.depth.min, settings.depth.max)
        this.radius = this.random(settings.particles.size.min, settings.particles.size.max) / this.z

        this.x_velocity = 1 / this.z
        this.y_velocity = 1 / this.z

        if (this.toss % 2 == 0) {

            var values = [0, width]
            this.x = (initial) ? Math.floor(values[Math.floor(Math.random() * values.length)]) : this.random(0, width)
            this.y = this.random(0, height)

            if (this.x == 0) {
                this.x_velocity *= this.random(0, settings.particles.velocity.x)
            }
            else {
                this.x_velocity *= (-1) * this.random(0, settings.particles.velocity.x)
            }

            this.y_velocity *= this.random((-1) * settings.particles.velocity.y, settings.particles.velocity.y)

        }

        else {

            var values = [0, height]
            this.x = this.random(0, width)
            this.y = (initial) ? Math.floor(values[Math.floor(Math.random() * values.length)]) : this.random(0, height)

            if (this.y == 0) {
                this.y_velocity *= this.random(0, settings.particles.velocity.y)
            }
            else {
                this.y_velocity *= (-1) * this.random(0, settings.particles.velocity.y)
            }

            this.x_velocity *= this.random((-1) * settings.particles.velocity.x, settings.particles.velocity.x)

        }

    }

    update () {

        this.x += this.x_velocity / this.z
        this.y += this.y_velocity / this.z

    }

    random (low, high) {
        return low + (Math.random() * (high - low))
    }

}

Scene.scenes = 0
