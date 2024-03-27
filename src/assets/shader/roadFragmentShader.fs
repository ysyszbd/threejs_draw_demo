uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform bool solid;

varying vec3 vWorldPosition;

void main() {
  float h = vWorldPosition.y+offset;

  vec3 mColor = topColor;
  
  if (!solid) {
    if ( (int(h / 3.0) % 2) == 0 ) {
      mColor = bottomColor;
    } else {
      gl_FragColor = vec4( mColor , 1.0 );  
    }
  } else {
    gl_FragColor = vec4( mColor , 1.0 );
  }
}