<?php

function formatMinutes($minutes) {
    $formatted = '';
    if ($minutes >= 60) {
        $formatted .= floor($minutes/60) . 'ч ';
    }
    if ($minutes % 60 > 0) {
        $formatted .= $minutes % 60 . 'мин';
    }
    return $formatted ? $formatted : $minutes;
}


