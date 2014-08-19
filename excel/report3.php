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

$spentTime = $data['timeInfo'];

$spreadsheet = new PHPExcel();
$spreadsheet->setActiveSheetIndex(0);

$spreadsheet->getActiveSheet()
    ->setCellValue('C3', 'Отчет в часах о проекте ' . $data['projectName'])
    ->setCellValue('C4', 'ID:')
    ->setCellValue('G4', $data['projectId'])
    ->setCellValue('C5', 'Дата формирования:')
    ->setCellValue('G5', $data['currentDate'])
    ->setCellValue('C6', 'Руководитель проекта:')
    ->setCellValue('G6', $data['users'][$data['projectLeadLogin']]['fullName'])
    ->setCellValue('C7', 'Дата создания первого таска:')
    ->setCellValue('G7', $data['firstIssueDate'])
    ->setCellValue('C8', 'Дата создания последнего таска:')
    ->setCellValue('G8', $data['lastIssueDate'])
    ->setCellValue('C9', 'Описание:')
    ->setCellValue('G9', $data['projectDescription'])

    ->setCellValue('C11', 'Отчет')

    ->setCellValue('O11', 'Сводка')
    ;

$spreadsheet->getActiveSheet()->getColumnDimension('B')->setWidth(5.140625);
$spreadsheet->getActiveSheet()->getColumnDimension('C')->setWidth(3.85546875);
$spreadsheet->getActiveSheet()->getColumnDimension('D')->setWidth(4);
$spreadsheet->getActiveSheet()->getColumnDimension('E')->setWidth(3.7109375);
$spreadsheet->getActiveSheet()->getColumnDimension('F')->setWidth(13.7109375);
$spreadsheet->getActiveSheet()->getColumnDimension('G')->setWidth(10.140625);
$spreadsheet->getActiveSheet()->getColumnDimension('L')->setWidth(20);
$spreadsheet->getActiveSheet()->getColumnDimension('P')->setWidth(22.28515625);
$spreadsheet->getActiveSheet()->getColumnDimension('R')->setWidth(15);

$spreadsheet->getActiveSheet()->getRowDimension('3')->setRowHeight(23.25);
$spreadsheet->getActiveSheet()->getRowDimension('6')->setRowHeight(24.75);
$spreadsheet->getActiveSheet()->getRowDimension('7')->setRowHeight(30.75);
$spreadsheet->getActiveSheet()->getRowDimension('8')->setRowHeight(30.75);
$spreadsheet->getActiveSheet()->getRowDimension('9')->setRowHeight(24.75);
$spreadsheet->getActiveSheet()->getRowDimension('10')->setRowHeight(18);
$spreadsheet->getActiveSheet()->getRowDimension('11')->setRowHeight(26.25);
$spreadsheet->getActiveSheet()->getRowDimension('12')->setRowHeight(18.75);

$spreadsheet->getActiveSheet()->mergeCells('C3:L3');
$spreadsheet->getActiveSheet()->mergeCells('C4:F4');
$spreadsheet->getActiveSheet()->mergeCells('C5:F5');
$spreadsheet->getActiveSheet()->mergeCells('C6:F6');
$spreadsheet->getActiveSheet()->mergeCells('C7:F7');
$spreadsheet->getActiveSheet()->mergeCells('C8:F8');
$spreadsheet->getActiveSheet()->mergeCells('C9:F9');
$spreadsheet->getActiveSheet()->mergeCells('G4:R4');
$spreadsheet->getActiveSheet()->mergeCells('G5:R5');
$spreadsheet->getActiveSheet()->mergeCells('G6:R6');
$spreadsheet->getActiveSheet()->mergeCells('G7:R7');
$spreadsheet->getActiveSheet()->mergeCells('G8:R8');
$spreadsheet->getActiveSheet()->mergeCells('G9:R9');
$spreadsheet->getActiveSheet()->mergeCells('C11:L11');
$spreadsheet->getActiveSheet()->mergeCells('O11:R11');

$spreadsheet->getDefaultStyle()->applyFromArray(array(
    "font" => array(
        "name" => "Calibri",
        "size" => 11,
    )
));

$bigHeaderStyle = array("font" => array(
    'size' => 18,
    "bold" => true
  )
);

$headerStyle = array("font" => array(
    'size' => 14,
    "bold" => true
  )
);

$subHeaderStyle = array("font" => array(
    'size' => 12,
    "bold" => true,
    "italic" => true,
  )
);

$spreadsheet->getActiveSheet()->getStyle('C3')->applyFromArray($bigHeaderStyle);
$spreadsheet->getActiveSheet()->getStyle('C11')->applyFromArray($bigHeaderStyle);
$spreadsheet->getActiveSheet()->getStyle('O11')->applyFromArray($bigHeaderStyle);

$spreadsheet->getActiveSheet()->getStyle('C4:R9')->applyFromArray(
  array("alignment" => array(
    'vertical' => \PHPExcel_Style_Alignment::VERTICAL_TOP,
    "wrap" => true
  ))
);

/** Сводка */

$currentRowIndex = 12;
$summaries = array(
    "byIssueType" => 'Распределение по типам задач',
    "byUserPosition" => 'Распределение по должностям',
    "byUserLogin" => 'Распределение по людям',
);
foreach ($summaries as $summaryType => $summaryName) {

    $spreadsheet->getActiveSheet()->setCellValue('O' . $currentRowIndex, $summaryName);
    $spreadsheet->getActiveSheet()->mergeCells('O' . $currentRowIndex . ':R' . $currentRowIndex);
    $spreadsheet->getActiveSheet()->getRowDimension($currentRowIndex)->setRowHeight(18.75);
    $spreadsheet->getActiveSheet()->getStyle('O' . $currentRowIndex)->applyFromArray($headerStyle);

    $summaryNameRowIndex = $currentRowIndex;
    $currentRowIndex += 1;

    // Sort in descending order
    uasort($spentTime[$summaryType], function ($a, $b) { return $b - $a; });

    foreach ($spentTime[$summaryType] as $issue => $time) {
        $spreadsheet->getActiveSheet()
            ->setCellValue('O' . $currentRowIndex, ($currentRowIndex - $summaryNameRowIndex))
            ->setCellValue('P' . $currentRowIndex, $issue)
            ->setCellValue('Q' . $currentRowIndex, round(100 * $time / $spentTime['total'], 1) . '%')
            ->setCellValue('R' . $currentRowIndex, formatMinutes($time));

        if (($currentRowIndex - $summaryNameRowIndex) % 2 != 0) {
            $spreadsheet->getActiveSheet()->getStyle('O'. $currentRowIndex . ':R' . $currentRowIndex)->getFill()->setFillType(\PHPExcel_Style_Fill::FILL_SOLID);
            $spreadsheet->getActiveSheet()->getStyle('O'. $currentRowIndex . ':R' . $currentRowIndex)->getFill()->getStartColor()->setARGB('f2f2f2');
        }

        $currentRowIndex += 1;
    }

    $spreadsheet->getActiveSheet()->setCellValue('O' . $currentRowIndex, 'Итого');
    $spreadsheet->getActiveSheet()->setCellValue('Q' . $currentRowIndex, '100%');
    $spreadsheet->getActiveSheet()->setCellValue('R' . $currentRowIndex, formatMinutes($spentTime['total']));

    $spreadsheet->getActiveSheet()->mergeCells('O' . $currentRowIndex . ':P' . $currentRowIndex);
    $spreadsheet->getActiveSheet()->getStyle('O'. $currentRowIndex . ':R' . $currentRowIndex)->getFill()->setFillType(\PHPExcel_Style_Fill::FILL_SOLID);
    $spreadsheet->getActiveSheet()->getStyle('O'. $currentRowIndex . ':R' . $currentRowIndex)->getFill()->getStartColor()->setARGB('d9d9d9');

    $spreadsheet->getActiveSheet()->getStyle('Q12:R' . $currentRowIndex)->getAlignment()->setHorizontal(\PHPExcel_Style_Alignment::HORIZONTAL_RIGHT);
    $currentRowIndex += 3;
}

/** Отчет */

$currentRowIndex = 12;
$subsystem = $data['timeInfo']['bySubsystem'];
foreach ($subsystem as $subsystemName => $subsystemData) {
    if ($subsystemName !== 'nosubsystem') {
        $spreadsheet->getActiveSheet()
            ->setCellValue('C' . $currentRowIndex, $subsystemName)
            ->setCellValue('L' . $currentRowIndex, formatMinutes($subsystemData['total']));
    }
    $spreadsheet->getActiveSheet()->mergeCells('C' . $currentRowIndex . ':K' . $currentRowIndex);
    $spreadsheet->getActiveSheet()->getRowDimension($currentRowIndex)->setRowHeight(18.75);
    $spreadsheet->getActiveSheet()->getStyle('C'. $currentRowIndex . ':L' . $currentRowIndex)->getFill()->setFillType(\PHPExcel_Style_Fill::FILL_SOLID);
    $spreadsheet->getActiveSheet()->getStyle('C'. $currentRowIndex . ':L' . $currentRowIndex)->getFill()->getStartColor()->setARGB('f2f2f2');
    $spreadsheet->getActiveSheet()->getStyle('C' . $currentRowIndex . ':L' . $currentRowIndex)->applyFromArray($headerStyle);

    $currentRowIndex += 1;
    foreach ($subsystemData as $userPositionName => $userPositionData) {
        if ($userPositionName === 'total') {
            continue;
        }
        $spreadsheet->getActiveSheet()
            ->setCellValue('D' . $currentRowIndex, $userPositionName)
            ->setCellValue('L' . $currentRowIndex, formatMinutes($userPositionData['total']));

        $spreadsheet->getActiveSheet()->mergeCells('D' . $currentRowIndex . ':K' . $currentRowIndex);
        $spreadsheet->getActiveSheet()->getStyle('D' . $currentRowIndex . ':L' . $currentRowIndex)->applyFromArray($subHeaderStyle);

        $currentRowIndex += 1;
        foreach ($userPositionData as $userName => $userData) {
            if ($userName === 'total') {
                continue;
            }
            $spreadsheet->getActiveSheet()
                ->setCellValue('E' . $currentRowIndex, $userName)
                ->setCellValue('L' . $currentRowIndex, formatMinutes($userData['total']));

            $spreadsheet->getActiveSheet()->mergeCells('E' . $currentRowIndex . ':K' . $currentRowIndex);
            $spreadsheet->getActiveSheet()->getStyle('E'. $currentRowIndex . ':L' . $currentRowIndex)->getFill()->setFillType(\PHPExcel_Style_Fill::FILL_SOLID);
            $spreadsheet->getActiveSheet()->getStyle('E'. $currentRowIndex . ':L' . $currentRowIndex)->getFill()->getStartColor()->setARGB('d9d9d9');

            $currentRowIndex += 1;
            foreach ($userData as $issue => $time) {
                if ($issue === 'total') {
                    continue;
                }
                $spreadsheet->getActiveSheet()
                    ->setCellValue('F' . $currentRowIndex, $issue)
                    ->setCellValue('L' . $currentRowIndex, formatMinutes($time));

                $spreadsheet->getActiveSheet()->mergeCells('F' . $currentRowIndex . ':K' . $currentRowIndex);

                $currentRowIndex += 1;
            }
        }
    }
}

$spreadsheet->getActiveSheet()
    ->setCellValue('C' . $currentRowIndex, 'ИТОГО')
    ->setCellValue('L' . $currentRowIndex, formatMinutes($spentTime['total']));

$spreadsheet->getActiveSheet()->mergeCells('C' . $currentRowIndex . ':K' . $currentRowIndex);
$spreadsheet->getActiveSheet()->getStyle('C'. $currentRowIndex . ':L' . $currentRowIndex)->getFill()->setFillType(\PHPExcel_Style_Fill::FILL_SOLID);
$spreadsheet->getActiveSheet()->getStyle('C'. $currentRowIndex . ':L' . $currentRowIndex)->getFill()->getStartColor()->setARGB('d9d9d9');
$spreadsheet->getActiveSheet()->getStyle('C' . $currentRowIndex . ':L' . $currentRowIndex)->applyFromArray($headerStyle);
$spreadsheet->getActiveSheet()->getStyle('L12:L' . $currentRowIndex)->getAlignment()->setHorizontal(\PHPExcel_Style_Alignment::HORIZONTAL_RIGHT);

// Draw border
$spreadsheet->getActiveSheet()->getStyle('C12:L' . $currentRowIndex)->applyFromArray(
  array("borders" => array(
    'outline' => array(
        "style" => \PHPExcel_Style_Border::BORDER_THIN,
        "color" => array('argb' => 'FF000000'),
    )
  ))
);

if (!is_dir('/tmp/youtrack-report')) {
    mkdir('/tmp/youtrack-report');
}

$tmpFileName = sprintf('/tmp/youtrack-report/%s.xlsx', time());

$objWriter = PHPExcel_IOFactory::createWriter($spreadsheet, 'Excel2007');
$objWriter->save($tmpFileName);

//var_dump($data);
echo 'file: ' . $tmpFileName;
