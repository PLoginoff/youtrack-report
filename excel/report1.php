<?php

require "vendor/autoload.php";
require "func.php";

$handle = fopen("php://stdin", "r");
$input = '';
while (($buffer = fgets($handle)) !== false) {
    $input .= $buffer;
}
fclose($handle);

$data = json_decode($input, $assoc = true);
if ($data === null) {
    echo "Error: invalid data format";
    exit;
}

$spreadsheet = new PHPExcel();
$spreadsheet->setActiveSheetIndex(0);

$spreadsheet->getActiveSheet()
    ->setCellValue('C1', 'Отчет в часах по Клиенту ' . $data['projectName'])
    ->setCellValue('C2', 'ID:')
    ->setCellValue('G2', $data['projectId'])
    ->setCellValue('C3', 'Дата формирования отчета')
    ->setCellValue('G3', $data['currentDate'])
    ->setCellValue('C4', 'Руководитель проекта:')
    ->setCellValue('G4', $data['projectLeadName'])
    ->setCellValue('A5', 'Номер таска')
    ->setCellValue('B5', 'Job Number')
    ->setCellValue('C5', 'Наименование работы')
    ->setCellValue('D5', 'Исполнитель')
    ->setCellValue('E5', 'Должность')
    ->setCellValue('F5', 'Время продажи')
    ->setCellValue('G5', 'Затраченное время')
    ;

$spreadsheet->getActiveSheet()->getColumnDimension('A')->setWidth(18);
$spreadsheet->getActiveSheet()->getColumnDimension('B')->setWidth(20);
$spreadsheet->getActiveSheet()->getColumnDimension('C')->setWidth(43.42578125);
$spreadsheet->getActiveSheet()->getColumnDimension('D')->setWidth(21.7109375);
$spreadsheet->getActiveSheet()->getColumnDimension('E')->setWidth(18.7109375);
$spreadsheet->getActiveSheet()->getColumnDimension('F')->setWidth(18.7109375);
$spreadsheet->getActiveSheet()->getColumnDimension('G')->setWidth(18.5703125);

$spreadsheet->getActiveSheet()->getRowDimension('1')->setRowHeight(23.25);
$spreadsheet->getActiveSheet()->getRowDimension('5')->setRowHeight(30);

$spreadsheet->getActiveSheet()->mergeCells('C1:L1');
$spreadsheet->getActiveSheet()->mergeCells('C2:F2');
$spreadsheet->getActiveSheet()->mergeCells('G2:R2');
$spreadsheet->getActiveSheet()->mergeCells('C3:F3');
$spreadsheet->getActiveSheet()->mergeCells('G3:R3');
$spreadsheet->getActiveSheet()->mergeCells('C4:F4');
$spreadsheet->getActiveSheet()->mergeCells('G4:R4');

$spreadsheet->getActiveSheet()->getStyle('C1')->getFont()->setBold(true);
$spreadsheet->getActiveSheet()->getStyle('C1')->getFont()->setSize(18);

$spreadsheet->getActiveSheet()->getStyle('A5')->getAlignment()->setWrapText(true);

$sellTimeTotal = 0;
$actualTimeTotal = 0;
$currentRowIndex = 6;
foreach ($data['issues'] as $issue) {
    $spreadsheet->getActiveSheet()
        ->setCellValue('A' . $currentRowIndex, $issue['issueId'])
        ->setCellValue('B' . $currentRowIndex, $issue['jobNumber'])
        ->setCellValue('C' . $currentRowIndex, $issue['issueSummary'])
        ->setCellValue('D' . $currentRowIndex, $issue['asigneeFullName'])
        ->setCellValue('E' . $currentRowIndex, $issue['asigneePosition'])
        ->setCellValue('F' . $currentRowIndex, formatMinutes($issue['sellTime']))
        ->setCellValue('G' . $currentRowIndex, formatMinutes($issue['actualTime']))
    ;

    $sellTimeTotal += $issue['sellTime'];
    $actualTimeTotal += $issue['actualTime'];

    $currentRowIndex += 1;
}

$spreadsheet->getActiveSheet()
    ->setCellValue('A' . $currentRowIndex, 'Итого')
    ->setCellValue('E' . $currentRowIndex, formatMinutes($sellTimeTotal))
    ->setCellValue('F' . $currentRowIndex, formatMinutes($actualTimeTotal))
;

if (!is_dir('/tmp/youtrack-report')) {
    mkdir('/tmp/youtrack-report');
}

// TODO check that file doesn't exist
$tmpFileName = sprintf('/tmp/youtrack-report/%s.xlsx', time());

$objWriter = PHPExcel_IOFactory::createWriter($spreadsheet, 'Excel2007');
$objWriter->save($tmpFileName);

echo 'file: ' . $tmpFileName;
