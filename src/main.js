import { 
    Application, 
    Graphics,
    Rectangle,
    Texture,
    Text, 
    TextStyle, 
    Sprite, 
    Assets,
    Container,
    Ticker
} from 'pixi.js';

import { initDevtools } from '@pixi/devtools';

import { Howl } from 'howler';

import { Easing, Tween, Group } from '@tweenjs/tween.js';

/*
    I provide comments detailing my broad thinking and go into more detail what went on with 
    each task.

    Unfortunately while I did functionally complete the tasks, these tasks ended up being a 
    little challenging than expected, as I ended up needing to spend time reading up tutorials
    for PixiJS.
    the challenges were fair and straight forward and I have completed all three parts on a basic level
    but just didn't have the time to do a more elegant or a cleaner solution.

    Consequently I wasn't able to make these solutions particularly robust or looked into their 
    responsiveness for different platforms.

    I missed that it asked for pixijs v7, since I was working from a fresh pixijs environment 
    I suspect I have version 8, hopefully this isn't a huge deal.

    Everything needed should be in this folder, I installed VS Code and followed tutorials
    for a complete self contained Live Serve setup using 'Vite'.

    I used PixiJS, and TweenJS.

    - Blayne
*/

(async () => {
    const app = new Application();

    await app.init(
    {
        resizeTo: window,
    });

    initDevtools({app});

    if (document.getElementById('canvas-container'))
    {
        document.getElementById('canvas-container').appendChild(app.canvas);
    }

    await Assets.init({ magicwords: '/magicwords.json'});

    // task 1 assets

    // putting await init code here
    const stackMarker = await Assets.load('/images/stackmarker.png');
    const textureAtlas = await Assets.load('/images/cards.png');

    // global stuff
    const tweens = new Group();
    const sprites = [];

    app.stage.sortableChildren = true;

    // task 2 stuff
    // loading the asset bundles
    Assets.addBundle('dialogue', {
        magicwords: 'magicwords.json'
    });

    const { magicwords } = await Assets.loadBundle('dialogue');

    // task 3 textures
    const flameTexture = await Assets.load('/images/flame.png');
    
    const flames = [];

    // FPS Counter
    const fpsCounter = document.getElementById('fps-counter');
    let lastTime = performance.now();
    let frames = 0;
    
    function updateFPS() {
        const now = performance.now();
        frames++;
  
        if (now - lastTime >= 1000) {
          const fps = Math.round((frames * 1000) / (now - lastTime));
          fpsCounter.textContent = `${fps} FPS`;
          frames = 0;
          lastTime = now;
        }
  
        requestAnimationFrame(updateFPS);
      }
  
      requestAnimationFrame(updateFPS);

    window.task1 = function()
    {
        // 144 Sprites
        /*
            I made a 1440 by 1440 texture with some random splashes of colour,
            turn that into a spritesheet which then is 12 by 12 rows by columns
            of "cards".

            I'm sure there's other ways but this seemed straight forward and I wanted 
            the 144 sprites to look visually appealing if it wasn't a lot of effort.

            There were some technical issues with trying to "crop" a smaller texture
            from my atlas among other issues but I eventually found a way.

            I originally planned on two containers where the cards start in one stack
            and move to the other and reparent but this wasn't working and move on to
            just using global positions.

            In any case, from my 144 sprites (100x100), its a simple loop to 
            make them, then in the Ticker every second I use TweenJS to animated them 
            moving to the other stack over 2 seconds. 

            Found technical issues with the cleanup with exceptions and I suspect race conditions.
        */          

        const firstStackSprite = new Sprite(stackMarker);
        const secondStackSprite = new Sprite(stackMarker);

        app.stage.addChild(firstStackSprite);
        app.stage.addChild(secondStackSprite);

        const deckSize = 144;
        const margin = 25;
        const secondStackStartPosX = 200 + margin;

        // basically just putting the two places and a helpful visual marker in two reasonable spots
        firstStackSprite.position.set(margin, margin+deckSize);
        secondStackSprite.position.set(secondStackStartPosX, margin+deckSize);

        const cellWidth = 100;
        const cellHeight = 100;

        const columns = 12; // 12 * 12 == 144

        // cutting up the atlas into cards
        for (let i = 0; i < deckSize; i++)
        {
            const x = (i % columns) * cellWidth;
            const y = Math.floor(i / columns) * cellHeight;

            const subtexture = new Texture({
                source: textureAtlas, 
                frame: new Rectangle(x, y, cellWidth, cellHeight)
            });
            const sprite = new Sprite(subtexture);
            app.stage.addChild(sprite);
            sprites.push(sprite);
            sprite.position.set(firstStackSprite.x, firstStackSprite.y -i);

        }

        let elapsed = 0;
        let cardCounter = 0; // pun intended
        const tween = new Tween(Object);
        // every second do our animation for 2 seconds
        // we go from the top card of the left stack and place it 
        // on top of the right stack fiddling with zOrdering to do so.
        Ticker.shared.add((delta) => {
            elapsed += Ticker.shared.deltaMS;

            if (elapsed >= 1000 && cardCounter < deckSize) {
                CreateTween(cardCounter);

                elapsed = 0;
                if (cardCounter > 0)
                {
                    sprites[deckSize - cardCounter].zIndex = cardCounter - 1;
                }

                cardCounter++;

                animate(delta); // stop updating tweens when we're done
            }

            // attempt at a 'if we're done we're done'
            if (cardCounter >= deckSize) {
                Ticker.shared.stop();
            }
        });

        // apparently PixiJS doesn't really have a Lerp function, weird.
        function CreateTween(counter)
        {
            const childSprite = sprites[deckSize - counter - 1];
            const tween = new Tween(childSprite)
            .to({x: secondStackSprite.position.x, y: secondStackSprite.position.y - cardCounter}, 2000);
            tweens.add(tween);
            tween.start();
        }

        // update the tween
        function animate(time)
        {
            requestAnimationFrame(animate);
            tweens.update();
        }
    };

    window.task2 = function() {        
        /*
            This task is a little confusing but my best guess was that for each line of dialogue
            we replace the emotion in brackets with the appropriate emoji.

            The main technical issue here is that I couldn't load the images into PixiJS, I found 
            I can load them in HTML so the plan was to print the lines of dialogue as HTML code 
            with inline images replacing the tokens.

            "affirmative" was missing, I added a entry for it for my local magicwords json reusing 
            satisfied.
        */
        const container = document.getElementById('dialogue');

        // basically for each element of the dialogue bundle get the text, replace the token with an inline emoji
        // append the html paragraph code with the amended text where the html page will load the img url, while
        // it wouldn't load using Sprite.from(texture)
        const len = magicwords.dialogue.length;
        for (let i = 0; i < len; i++)
        {
            const paragraph = document.createElement('p');
            paragraph.className = 'paragraph';
            paragraph.innerHTML = magicwords.dialogue[i].text.replace(/\{([^}]+)\}/g, (match, token) => {
                const icon = magicwords.emojies.find(item => item.name === token);
                return icon ? `<img src="${icon.url}" class="inline-icon">` : match;
            });
            container.appendChild(paragraph);
        }
    };

    window.task3 = function() {
        /*
            This one is ostensibly pretty easy especially after already completing the first task,
            just spawn some textures and have them scooch up the window and disappear to give the 
            illusion of a kind of flame or smoke.

            So tweaking numbers and speeds until it kinda looks like a cartoony flame.

            I didn't end up with time to make it look nicer, I dabbed some color on a png 
            and use it to form the basis of our particle system.

            The main issue is performance issues where I had trouble actually getting the 
            created sprites to properly delete themselves when they finished their movement.

            Just a matter of not really having the experience to be able to determine in 
            a only hours what the best practice is for keeping PixiJS memory management clean.
        */

        const containerSprite = new Sprite(stackMarker);
        containerSprite.scale.set(2.5, 2.5);

        const container = new Container();
        container.addChild(containerSprite)
        app.stage.addChild(container);
        container.position.set(500, 200);

        let elapsed = 0;
        let flameCount = 0;
        Ticker.shared.add(() => {
            elapsed += Ticker.shared.deltaMS;
            animate(Ticker.shared.deltaMS);

            if (elapsed >= 500)
            {
                if (flameCount >= 10)
                {
                    // delete the oldest particle at the chosen limit
                    container.removeChildAt(1).destroy({children: true, texture: true, baseTexture: true});
                    flameCount--;
                }
                else {
                    const flameSprite = Sprite.from(flameTexture);
                    container.addChild(flameSprite);
                    // place the particles semi-randomly in a constrained area.
                    flameSprite.position.set(Math.random() * 100, Math.random() * 100);                    
                    flameSprite.scale.set(5,5);
                    // tween the particles to move north with slight variance
                    const tween = new Tween(flameSprite)
                    .to({x: flameSprite.position.x + (0.5 - Math.random()) * 20, y: flameSprite.position.y - 500}, 3000)
                    .onComplete(() => {
                        // Can't seem to get proper cleanup to work
                        // current results is the particle effect loses steam as it brushes up against the 
                        // 10 sprite limit and presumably the other sprites aren't auto-destroying as their tween ends
                    });
                    tweens.add(tween);
                    tween.start();
                    flameCount++;                      
                }
                elapsed = 0;        
            }

        });

        function animate(time)
        {
            requestAnimationFrame(animate);
            tweens.update();
        }
    };

    // my attempts at trying to clean up the scene by destroying objects when I'm done with them
    // isn't working out, probably from inexperience with PixiJS/Typescript where I assume 
    // it's some kind of race condition of an object attempted being destroyed while still being 
    // accessed.

    // It's unclear to me what the best practice is, I assume something like make sure all tweens are
    // stopped and then all objects deleted or marked for garbage collection/destruction and their 
    // containers cleared, but I'm getting basically null reference exceptions when I try.

    function CleanupTweens()
    {
        const tbdTweens = tweens.getAll();
        for (const tween of tbdTweens)
        {
            tween.end();
        }
    }

    function CleanupSprites()
    {
        for (const sprite of sprites)
        {
            if (sprite.parent) {
                sprite.parent.removeChild(sprite);
            }            
            sprite.destroy({children: true, texture: true, baseTexture: true});
        }
        
        sprites.length = 0;
    }

})();

