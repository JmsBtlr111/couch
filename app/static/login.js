/**
 * Created by hugobateman on 7/07/15.
 */
R.ready(function() {
        $('.sign-in').click(function() {
          R.authenticate(function(nowAuthenticated) {
            if (nowAuthenticated) {
              $('.unauthenticated-view').hide();
              showAuthenticated();
            }
          });
        });
        $('.play').click(function() {
          R.player.play({ source: topTrack.key });
          showPlayback();
        });
        $('.toggle-pause').click(function() {
          R.player.togglePause();
        });
        R.player.on('change:playState', function(newPlayState) {
          showPlayState(newPlayState);
        });
        if (R.authenticated()) {
          showAuthenticated();
        } else {
          showUnauthenticated();
        }
        getTopTrack();
      });